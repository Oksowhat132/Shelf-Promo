# ShelfPromo

**Turn product packaging into an interactive marketing experience.**

ShelfPromo lets a shopper scan a product image with their phone, watch a promotional video, explore a 3D product, and see it floating above the packaging in augmented reality (AR). No mobile app installation is needed.

**Scan → Watch the promo → Explore in 3D → View in AR**

Use it for product demos, in-store marketing concepts, and brand presentations. This starter includes a SMASH mosquito-coil example. Other products need their own image, video, and 3D model; they are not recognized automatically.

## Try the live demo

No setup needed. Open this README on your computer, scan the QR code below with your phone, and tap **Scan to discover**. Then point your phone at the same product image to watch the promo. Choose **View in 3D**, then **View in AR** to explore the product.

[![Scan the QR code to open ShelfPromo, then point your phone at this product image.](docs/demo-scan.jpg)](https://shelfpromo-demo-721fe29f40e5.herokuapp.com/target.html)

[Open the phone experience](https://shelfpromo-demo-721fe29f40e5.herokuapp.com/) · [Open a larger image on your computer](https://shelfpromo-demo-721fe29f40e5.herokuapp.com/target.html)

The hosted demo is separate from the local setup below. Cloning this project still gives you your own local app and temporary tunnel.

## Run it on your computer

The included startup script is for **Windows**. Install [Node.js](https://nodejs.org/) and [Git](https://git-scm.com/), then open PowerShell:

```powershell
git clone https://github.com/Oksowhat132/Shelf-Promo.git
cd Shelf-Promo
npm.cmd install
```

Download the tunnel tool once. It gives your phone a secure link to your local app:

```powershell
New-Item -ItemType Directory -Force .tools | Out-Null
Invoke-WebRequest https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe -OutFile .tools/cloudflared.exe
npm.cmd run phone
```

The terminal displays your phone link and creates a QR code. No Cloudflare account is required.

## Try the experience

1. On your computer, open **http://localhost:3000/target.html**.
2. Scan the QR code with your phone and open it in Safari or Chrome.
3. Tap **Scan to discover**, allow camera access, and point at the product image on your computer.
4. Watch the promo, then tap **View in 3D**. Drag to rotate the product.
5. Tap **View in AR** and point at the image again.

The video has a loading screen, sound controls, and a tap-to-play option if autoplay is blocked. Keep the artwork visible and avoid glare when using AR. Start with the on-screen image; scanning the physical box can vary with lighting and angle.

**Keep your PC awake, online, and the terminal open.** The link is temporary and usually changes when the tunnel restarts. The QR code updates automatically; refresh the computer page. Each person who clones the project runs their own copy. This is not permanent hosting.

For a local preview without a tunnel, run `npm.cmd start` and open **http://localhost:3000**. Phone camera access needs the secure tunnel link.

## Use your own product

Some code changes are needed:

| Change | Where |
| --- | --- |
| Promo video | Replace `public/video/smash-promo.mp4`, keeping the filename. Portrait MP4 works best. |
| Packaging image | Replace `public/smash-plus.jpg` with a clear, front-facing product image. |
| Tracking data | With the server running, run `npm.cmd run compile` to rebuild the image recognition data. Requires Google Chrome. |
| 3D product | Replace the sample coil code in `public/product-model.js` with your product model. |
| Branding and product details | Edit `public/index.html`, `public/target.html`, and `public/style.css`. |

Refresh the phone page after changes. The demo's 3D coil is an illustration, not an exact product model.

## Development

With `npm.cmd run phone` running, use `npm.cmd test` in a second terminal to check the video, loading and retry states, 3D/AR flow, and camera handling using Google Chrome. Also test on a real phone.

Built with [MindAR](https://github.com/hiukim/mind-ar-js) and [Three.js](https://threejs.org/). Their license notices are included in `public/vendor/`. Camera images are processed in the browser.
