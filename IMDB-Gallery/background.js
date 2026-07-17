(importScripts('extpay.js'), importScripts('jszip.min.js'));
const extpay = ExtPay('imdb-gallery-downloader');
let currentUser = { paid: !1 };

function updateUserCache() {
  return (
    console.log('Forcing a refresh of user status from ExtensionPay...'),
    extpay
      .getUser()
      .then((e) => {
        ((currentUser = e),
          console.log(`SUCCESS: User cache updated. 'paid' status is now: ${currentUser.paid}`));
      })
      .catch((e) => {
        console.error('ERROR: Failed to update user cache:', e);
      })
  );
}

function sanitizeFilename(e) {
  return e.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
}
(extpay.onPaid && 'function' == typeof extpay.onPaid.addListener
  ? extpay.onPaid.addListener((e) => {
      (console.log('EVENT: Payment received! Updating user cache.', e), (currentUser = e));
    })
  : console.error('Could not attach listener to extpay.onPaid. The API may have changed.'),
  chrome.runtime.onMessage.addListener(function (e, t, a) {
    if ('get_user_status' === e.action)
      return (
        updateUserCache().then(() => {
          (console.log(`RESPONDING: Popup asked for status. Responding with: ${currentUser.paid}`),
            a({ paid: currentUser.paid }));
        }),
        !0
      );
    if ('open_payment_page' === e.action)
      return (console.log('Opening payment page...'), extpay.openPaymentPage(), !0);
    if ('logout' === e.action)
      return (
        console.log('Logging out user. Clearing local cache.'),
        (currentUser = { paid: !1 }),
        !0
      );
    if ('downloadImagesAsZip' === e.action) {
      let { images: t, title: r } = e,
        n = !1;
      return (
        updateUserCache()
          .then(() => {
            console.log('DOWNLOAD CHECK: Downloading all images.');
            const e = sanitizeFilename(r);
            new JSZip().folder(e);
            chrome.runtime.sendMessage({
              action: 'updateStatus',
              status: `Fetching ${t.length} images...`,
            });
            const a = t.map(async (e, t) => {
              const a = await fetch(e.url);
              if (!a.ok) throw new Error(`Failed to fetch image ${t + 1}: ${a.statusText}`);
              const r = await a.blob(),
                n = e.url.split('.').pop().split('?')[0] || 'jpg';
              return {
                filename: `${String(t + 1).padStart(3, '0')}_${sanitizeFilename(e.caption)}.${n}`,
                blob: r,
              };
            });
            return Promise.all(a);
          })
          .then((e) => {
            chrome.runtime.sendMessage({
              action: 'updateStatus',
              status: 'Creating zip file...',
            });
            const t = new JSZip(),
              a = t.folder(sanitizeFilename(r));
            return (
              e.forEach((e) => {
                a.file(e.filename, e.blob);
              }),
              t.generateAsync({ type: 'blob' })
            );
          })
          .then((e) => {
            const o = URL.createObjectURL(e);
            chrome.downloads.download(
              {
                url: o,
                filename: `${sanitizeFilename(r)}.zip`,
                saveAs: !1,
              },
              (e) => {
                (URL.revokeObjectURL(o),
                  chrome.runtime.lastError
                    ? a({
                        success: !1,
                        error: chrome.runtime.lastError.message,
                      })
                    : a({ success: !0, count: t.length, limitReached: n }));
              }
            );
          })
          .catch((e) => {
            (console.error('Zip creation failed:', e), a({ success: !1, error: e.message }));
          }),
        !0
      );
    }
  }));
