================================================
FILE: jamdlbhbakiojceimbalabbcoigaceag/background.js
================================================
importScripts("extpay.js"),importScripts("jszip.min.js");const extpay=ExtPay("imdb-gallery-downloader");let currentUser={paid:!1};function updateUserCache(){return console.log("Forcing a refresh of user status from ExtensionPay..."),extpay.getUser().then((e=>{currentUser=e,console.log(`SUCCESS: User cache updated. 'paid' status is now: ${currentUser.paid}`)})).catch((e=>{console.error("ERROR: Failed to update user cache:",e)}))}function sanitizeFilename(e){return e.replace(/[^\w\s-]/g,"").replace(/\s+/g,"_")}extpay.onPaid&&"function"==typeof extpay.onPaid.addListener?extpay.onPaid.addListener((e=>{console.log("EVENT: Payment received! Updating user cache.",e),currentUser=e})):console.error("Could not attach listener to extpay.onPaid. The API may have changed."),chrome.runtime.onMessage.addListener((function(e,t,a){if("get_user_status"===e.action)return updateUserCache().then((()=>{console.log(`RESPONDING: Popup asked for status. Responding with: ${currentUser.paid}`),a({paid:currentUser.paid})})),!0;if("open_payment_page"===e.action)return console.log("Opening payment page..."),extpay.openPaymentPage(),!0;if("logout"===e.action)return console.log("Logging out user. Clearing local cache."),currentUser={paid:!1},!0;if("downloadImagesAsZip"===e.action){let{images:t,title:r}=e,n=!1;return updateUserCache().then((()=>{console.log(`DOWNLOAD CHECK: Starting download. Is user premium? ${currentUser.paid}`),!currentUser.paid&&t.length>10?(console.log("DOWNLOAD CHECK: User is NOT premium. Limiting to 10 images."),t=t.slice(0,10),n=!0):console.log("DOWNLOAD CHECK: User IS premium. Downloading all images.");const e=sanitizeFilename(r);(new JSZip).folder(e);chrome.runtime.sendMessage({action:"updateStatus",status:`Fetching ${t.length} images...`});const a=t.map((async(e,t)=>{const a=await fetch(e.url);if(!a.ok)throw new Error(`Failed to fetch image ${t+1}: ${a.statusText}`);const r=await a.blob(),n=e.url.split(".").pop().split("?")[0]||"jpg";return{filename:`${String(t+1).padStart(3,"0")}_${sanitizeFilename(e.caption)}.${n}`,blob:r}}));return Promise.all(a)})).then((e=>{chrome.runtime.sendMessage({action:"updateStatus",status:"Creating zip file..."});const t=new JSZip,a=t.folder(sanitizeFilename(r));return e.forEach((e=>{a.file(e.filename,e.blob)})),t.generateAsync({type:"blob"})})).then((e=>{const o=URL.createObjectURL(e);chrome.downloads.download({url:o,filename:`${sanitizeFilename(r)}.zip`,saveAs:!1},(e=>{URL.revokeObjectURL(o),chrome.runtime.lastError?a({success:!1,error:chrome.runtime.lastError.message}):a({success:!0,count:t.length,limitReached:n})}))})).catch((e=>{console.error("Zip creation failed:",e),a({success:!1,error:e.message})})),!0}}));


================================================
FILE: jamdlbhbakiojceimbalabbcoigaceag/content.js
================================================
async function extractImageUrlsOnPage(){return async function(){await async function(){return new Promise(((e,t)=>{const o=Date.now();console.log("[IMDB Downloader] Starting smart scroll to load all images...");const n=setInterval((()=>{if(Date.now()-o>9e4)return clearInterval(n),void t(new Error("Scrolling timed out. Could not load all images."));const l=document.evaluate("/html/body/div[2]/main/div/section/div/section/div/div[1]/div/div/span",document,null,XPathResult.FIRST_ORDERED_NODE_TYPE,null).singleNodeValue;if(l){const t=l.textContent.trim().match(/(\d+)-(\d+) of (\d+)/);if(t){const[,o,l,a]=t;if(console.log(`[IMDB Downloader] Images loaded: ${o}-${l} of ${a}`),parseInt(l,10)>=parseInt(a,10))return clearInterval(n),window.scrollTo(0,0),console.log("[IMDB Downloader] All images have been successfully loaded."),void e()}}else{console.warn("[IMDB Downloader] Could not find the image counter. Using fallback scroll method.");const t=document.body.scrollHeight;if(window.innerHeight+window.scrollY>=t-100)return clearInterval(n),window.scrollTo(0,0),console.log("[IMDB Downloader] Reached end of page (fallback method)."),void e()}window.scrollBy(0,1e3)}),1500)}))}();let e=document.querySelector('h1[data-testid="hero-title-block__title"]'),t=e?e.textContent.trim().replace(/[^\w\s]/gi,""):"IMDB_Gallery";e||(e=document.querySelector("h1"),t=e?e.textContent.trim().replace(/[^\w\s]/gi,""):"IMDB_Gallery");let o=document.querySelectorAll("div[data-testid='MediaGrid'] img.ipc-image");if(0===o.length&&(o=document.querySelectorAll("section[data-testid='Photos'] img.ipc-image")),0===o.length&&(o=document.querySelectorAll('main img[src*="media-amazon.com/images/M"]')),0===o.length)return{success:!1,error:"Could not find any images after scrolling."};const n=[];return o.forEach(((e,t)=>{const o=e.src;if(o&&o.includes("media-amazon.com")&&(0===t||e.alt&&e.alt.includes("View Poster"))){const l=o.split("@")[0]+"@.jpg",a=e.alt||`Image ${t+1}`;n.find((e=>e.url===l))||n.push({url:l,caption:a})}})),0===n.length?{success:!1,error:'Could not find any specific gallery images (e.g., "View Poster").'}:{success:!0,title:t,images:n}}()}chrome.runtime.onMessage.addListener(((e,t,o)=>{if("extractImages"===e.action)return extractImageUrlsOnPage().then((e=>o(e))),!0}));


================================================
FILE: jamdlbhbakiojceimbalabbcoigaceag/developer_folder_tree.txt
================================================
.
├── _metadata
└── icons



================================================
FILE: jamdlbhbakiojceimbalabbcoigaceag/manifest.json
================================================
{
"update_url": "https://clients2.google.com/service/update2/crx",

  "manifest_version": 3,
  "name": "IMDB Gallery Downloader",
  "version": "1.0",
  "description": "Download all images from IMDB galleries as a single zip file.",
  "permissions": [
    "activeTab",
    "scripting",
    "storage"
  ],
  "host_permissions": [
    "https://www.imdb.com/*",
    "https://m.media-amazon.com/*",
    "https://extensionpay.com/*"
  ],
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["https://www.imdb.com/*/mediaindex*"],
      "js": ["content.js"]
    },
    {
      "matches": ["https://extensionpay.com/*"],
      "js": ["extpay.js"],
      "run_at": "document_start"
    }
  ],
  "web_accessible_resources": [
    {
      "resources": ["extpay.js"],
      "matches": ["https://extensionpay.com/*"]
    }
  ],
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}


================================================
FILE: jamdlbhbakiojceimbalabbcoigaceag/popup.html
================================================
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      width: 300px;
      padding: 10px;
      font-family: Arial, sans-serif;
    }
    .container {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    /* Styles for the status indicator */
    #statusIndicator {
      display: flex;
      flex-direction: column; /* Changed to column to stack elements */
      padding: 8px;
      border-radius: 4px;
      margin-bottom: 10px;
    }
    #statusIndicator .top-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }
    #statusIndicator.free {
      background-color: #f8d7da;
      border: 1px solid #f5c6cb;
      color: #721c24;
    }
    #statusIndicator.premium {
      background-color: #d4edda;
      border: 1px solid #c3e6cb;
      color: #155724;
    }
    #statusIndicator button {
      padding: 4px 8px;
      font-size: 12px;
      border-radius: 3px;
      border: none;
      cursor: pointer;
      font-weight: bold;
    }
    #statusIndicator .goPremiumBtn {
      background-color: #007bff;
      color: white;
    }
    #statusIndicator .goPremiumBtn:hover {
      background-color: #0056b3;
    }
    #statusIndicator .logoutBtn {
      background-color: #6c757d;
      color: white;
    }
    #statusIndicator .logoutBtn:hover {
      background-color: #5a6268;
    }
    /* New style for the warning text */
    #freeUserWarning {
      font-size: 11px;
      margin-top: 8px;
      line-height: 1.4;
      text-align: center;
    }
    button {
      padding: 10px;
      background-color: #f5c518;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
    }
    button:hover {
      background-color: #e5b518;
    }
    button:disabled {
      background-color: #cccccc;
      cursor: not-allowed;
    }
    .status {
      margin-top: 10px;
      font-size: 14px;
    }
    .error {
      color: red;
    }
    .success {
      color: green;
    }
    .info {
      color: #0066cc;
    }
    #progressBarContainer {
      width: 100%;
      background-color: #f0f0f0;
      border-radius: 4px;
      margin-top: 10px;
      display: none;
    }
    #progressBar {
      width: 0%;
      height: 20px;
      background-color: #4CAF50;
      border-radius: 4px;
      text-align: center;
      line-height: 20px;
      color: white;
      font-size: 12px;
      transition: width 0.3s ease;
    }
    #limitMessage {
      text-align: center;
      font-weight: bold;
      color: #d9534f;
    }
  </style>
  <script src="jszip.min.js"></script>
</head>
<body>
  <div class="container">
    <h3>IMDB Gallery Downloader</h3>

    <!-- Status Indicator -->
    <div id="statusIndicator">
      <div class="top-row">
        <span id="statusText">Checking status...</span>
        <button id="statusActionButton" class="goPremiumBtn">GO PREMIUM / LOGIN</button>
      </div>
      <!-- Warning text for free users -->
      <div id="freeUserWarning">
        ⚠️ Free users can only download 10 images max from galleries. Upgrade to premium to download full galleries.
      </div>
    </div>

    <div id="status" class="status info">Navigate to an IMDB gallery page to use this extension. (e.g. <a href="https://www.imdb.com/title/tt22741760/mediaindex/?ref_=mv?ref_=mv_sm" target="_blank">this page</a>)</div>
    
    <div id="progressBarContainer">
      <div id="progressBar"></div>
    </div>

    <div id="limitMessage" style="display: none;"></div>
    
    <button id="downloadBtn" disabled>Download Gallery Images</button>
  </div>
  <script src="popup.js"></script>
</body>
</html>


================================================
FILE: jamdlbhbakiojceimbalabbcoigaceag/popup.js
================================================
function sanitizeFilename(e){return e.replace(/[^\w\s-]/g,"").replace(/\s+/g,"_")}document.addEventListener("DOMContentLoaded",(function(){const e=document.getElementById("downloadBtn"),t=document.getElementById("status"),n=document.getElementById("limitMessage"),o=document.getElementById("progressBarContainer"),s=document.getElementById("progressBar"),a=document.getElementById("statusIndicator"),i=document.getElementById("statusText"),r=document.getElementById("statusActionButton"),l=document.getElementById("freeUserWarning");let c=!1;async function d(e=3){for(let n=0;n<e;n++){console.log(`[POPUP] Attempt ${n+1} to contact background script.`);try{const e=await chrome.runtime.sendMessage({action:"get_user_status"});if(console.log("[POPUP] Received response from background script:",e),chrome.runtime.lastError){const e=JSON.parse(JSON.stringify(chrome.runtime.lastError));throw console.error(`[POPUP] Attempt ${n+1}: Runtime error detected:`,e),new Error(e.message)}if(e&&void 0!==e.paid)return c=e.paid,console.log(`[POPUP] Success! isPremium is now: ${c}. Calling updateStatusUI.`),console.log(`[POPUP] updateStatusUI called. isPremium is currently: ${c}`),c?(a.className="premium",i.textContent="Premium User",r.style.display="none",l.style.display="none"):(a.className="free",i.textContent="Free User",r.style.display="inline-block",r.textContent="GO PREMIUM / LOGIN",r.className="goPremiumBtn",l.style.display="block"),void console.log(`[POPUP] UI Updated. statusText is now: "${i.textContent}"`);console.warn(`[POPUP] Attempt ${n+1}: Received an invalid response:`,e)}catch(o){console.warn(`[POPUP] Attempt ${n+1} failed to get user status. Error: ${o.message}`),n<e-1?(console.log("[POPUP] Waiting 500ms before retrying..."),await new Promise((e=>setTimeout(e,500)))):(console.error("[POPUP] All retries failed. Could not reach background script."),t.textContent="Error checking premium status. Please try reloading the extension.",t.className="status error")}}}console.log("[POPUP] Popup loaded. Calling checkUserStatus..."),d(),chrome.tabs.query({active:!0,currentWindow:!0},(function(n){const o=n[0].url;o.includes("imdb.com/")&&o.includes("/mediaindex")?e.disabled=!1:(t.innerHTML='Navigate to an IMDB gallery page to use this extension. (e.g. <a href="https://www.imdb.com/title/tt22741760/mediaindex/?ref_=mv?ref_=mv_sm" target="_blank">This page</a>)',e.disabled=!0)})),r.addEventListener("click",(function(){console.log("[POPUP] Opening payment/login page..."),chrome.runtime.sendMessage({action:"open_payment_page"})})),e.addEventListener("click",(async function(){t.textContent="Extracting image links... DON'T touch anything!",t.className="status info",e.disabled=!0,n.style.display="none",o.style.display="none";try{const[a]=await chrome.tabs.query({active:!0,currentWindow:!0}),i=await chrome.tabs.sendMessage(a.id,{action:"extractImages"});if(!i||!i.success)throw new Error(i?.error||"Could not extract images from the page.");let{title:r,images:l}=i;if(0===l.length)return t.textContent="No images found on this page.",t.className="status error",void(e.disabled=!1);await d(1),console.log(`[POPUP] DOWNLOAD CHECK: isPremium is ${c} before starting download.`),!c&&l.length>10&&(l=l.slice(0,10),n.textContent="This gallery has more than 10 images. Upgrade to download them all.",n.style.display="block");const m=new JSZip,u=m.folder(sanitizeFilename(r));o.style.display="block",s.style.width="0%";for(let e=0;e<l.length;e++){const n=l[e];t.textContent=`Fetching image ${e+1} of ${l.length}...`;const o=(e+1)/l.length*100;s.style.width=`${o}%`,s.textContent=`${Math.round(o)}%`;const a=await fetch(n.url);if(!a.ok)throw new Error(`Failed to fetch ${n.url}`);const i=await a.blob(),r=n.url.split(".").pop().split("?")[0]||"jpg",c=`${String(e+1).padStart(3,"0")}_${sanitizeFilename(n.caption)}.${r}`;u.file(c,i)}t.textContent="Creating zip file...";const g=await m.generateAsync({type:"blob"}),p=URL.createObjectURL(g),y=document.createElement("a");y.href=p,y.download=`${sanitizeFilename(r)}.zip`,document.body.appendChild(y),y.click(),document.body.removeChild(y),URL.revokeObjectURL(p),t.textContent=`Successfully downloaded ${l.length} images!`,t.className="status success"}catch(e){console.error(e),t.textContent=`Error: ${e.message}`,t.className="status error"}finally{e.disabled=!1,o.style.display="none"}}))}));

