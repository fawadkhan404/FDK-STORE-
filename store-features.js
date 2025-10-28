/* store-features.js
   Updated: includes interactive star rating (hover+click) and 3D/luxury UI touches.
   Frontend-only demo for FDK Store (localStorage based).
   Save as store-features.js and include at end of body:
   <script src="store-features.js"></script>
*/

/* ========== CONFIG ========== */
const GOOGLE_CLIENT_ID = ""; // optional; leave empty if you don't want Google one-tap now
const PRODUCT_LIST = [
  { id: "p-watch-001", title: "Men's Stainless Watch", price: 89.99, desc: "Stainless steel • Quartz • Water-resistant", images: ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&q=80"], features:["Stainless Steel","Quartz Movement","Water Resistant 50m"], featured3d: true },
  { id: "p-headphones-001", title: "Wireless Headphones", price: 59.99, desc: "Noise cancellation • 30h battery • Premium bass", images: ["https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=1200&q=80"], features:[], featured3d:false },
  { id: "p-sneakers-001", title: "Smart Sneakers", price: 120.00, desc: "Responsive sole • Modern silhouette", images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&q=80"], features:[], featured3d:false },
  { id: "p-sunglasses-001", title: "Aviator Sunglasses", price: 45.00, desc: "Polarized • UV400 protection", images: ["https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=1200&q=80"], features:[], featured3d:false }
];
/* ============================ */

/* tiny safe JSON parse */
const safeJSON = (s, fallback) => { try { return JSON.parse(s); } catch(e){ return fallback; } };

/* localStorage helpers */
const storage = {
  getCart: () => safeJSON(localStorage.getItem("fdk_cart"), []),
  saveCart: (cart) => localStorage.setItem("fdk_cart", JSON.stringify(cart)),
  getUser: () => safeJSON(localStorage.getItem("fdk_user"), null),
  saveUser: (u) => localStorage.setItem("fdk_user", JSON.stringify(u)),
  clearUser: () => localStorage.removeItem("fdk_user"),
  getReviews: () => safeJSON(localStorage.getItem("fdk_reviews"), {}), // { productId: [{email,name,rating,comment,date}] }
  saveReviews: (r) => localStorage.setItem("fdk_reviews", JSON.stringify(r)),
  getOrders: () => safeJSON(localStorage.getItem("fdk_orders"), {}), // { email: [order,...] }
  saveOrders: (o) => localStorage.setItem("fdk_orders", JSON.stringify(o))
};

/* ========== Inject small CSS for stars + 3D polish ========== */
(function injectCSS(){
  const css = `
  /* 3D / neon polish */
  .fdk-3d-card { transform: translateZ(0); transition: transform .35s cubic-bezier(.2,.9,.2,1), box-shadow .35s; will-change: transform; }
  .fdk-3d-card:hover { transform: translateY(-8px) rotateX(2deg) rotateY(2deg) scale(1.02); box-shadow: 0 30px 60px rgba(0,0,0,0.6); }
  .fdk-neon-btn { box-shadow: 0 10px 30px rgba(255,102,178,0.08), 0 0 18px rgba(255,205,65,0.05); border: 1px solid rgba(255,255,255,0.04); }
  /* stars */
  .fdk-stars { display:inline-flex; gap:6px; align-items:center; user-select:none; }
  .fdk-star { width:26px; height:26px; display:inline-flex; align-items:center; justify-content:center; cursor:pointer; transition: transform .12s; filter: drop-shadow(0 6px 18px rgba(0,0,0,0.45)); }
  .fdk-star svg { width:20px; height:20px; opacity:.22; transition: opacity .12s, transform .12s; transform-origin:center; }
  .fdk-star.filled svg { opacity:1; transform: scale(1.06); filter: drop-shadow(0 6px 20px rgba(255,200,100,0.12)); }
  .fdk-star:hover svg { transform: scale(1.12); opacity:1; }
  /* cart drawer */
  #fdk-cart-drawer { border: 1px solid rgba(255,255,255,0.04); backdrop-filter: blur(6px); }
  /* small responsive tweaks */
  @media (max-width:640px){ .fdk-star { width:22px; height:22px;} .fdk-star svg{width:16px;height:16px;} }
  `;
  const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);
})();

/* ========== small helpers ========== */
function $(s) { return document.querySelector(s); }
function $all(s) { return Array.from(document.querySelectorAll(s)); }
function toast(msg, timeout=2200) {
  let el = document.getElementById("fdk-toast");
  if(!el){ el = document.createElement("div"); el.id="fdk-toast"; el.style="position:fixed;left:50%;transform:translateX(-50%);bottom:28px;background:#0b1220;color:#f8f9fb;padding:10px 16px;border-radius:999px;z-index:99999;font-weight:700;"; document.body.appendChild(el); }
  el.textContent = msg; el.style.opacity = "1";
  setTimeout(()=> el.style.opacity = "0", timeout);
}

/* ========== Google sign-in minimal (optional) ========== */
function loadGoogleScript(cb){
  if(document.getElementById("google-identity")){ cb(); return; }
  const s = document.createElement("script"); s.id="google-identity"; s.src="https://accounts.google.com/gsi/client"; s.onload=cb; document.head.appendChild(s);
}
function parseJwt(token){ try{ const base64Url = token.split('.')[1]; const base64 = base64Url.replace(/-/g,'+').replace(/_/g,'/'); const jsonPayload = decodeURIComponent(atob(base64).split('').map(c=>'%'+('00'+c.charCodeAt(0).toString(16)).slice(-2)).join('')); return JSON.parse(jsonPayload); }catch(e){return null;} }
function initGoogle(){ if(!GOOGLE_CLIENT_ID) return; loadGoogleScript(()=>{ if(!window.google||!google.accounts) return; google.accounts.id.initialize({ client_id:GOOGLE_CLIENT_ID, callback: resp => { const payload = parseJwt(resp.credential); if(!payload) return; const u = { email: payload.email, name: payload.name || payload.given_name || payload.email.split('@')[0], picture: payload.picture || '', id: payload.sub }; storage.saveUser(u); renderHeaderUser(); toast(u.name + " signed in"); } }); renderHeaderUser(); }); }

/* ========== Header controls (cart + user area) ========== */
function ensureHeaderControls(){
  if(document.getElementById("fdk-controls")) { renderCartCount(); renderHeaderUser(); return; }
  const header = document.querySelector("header") || document.body;
  const wrapper = document.createElement("div"); wrapper.id="fdk-controls"; wrapper.style="display:flex;gap:10px;align-items:center;";
  wrapper.innerHTML = `
    <button id="fdk-cart-btn" aria-label="Cart" style="position:relative;padding:8px 10px;border-radius:999px;background:linear-gradient(90deg,#FFD54D,#FF66B2);border:none;cursor:pointer;font-weight:800;" class="fdk-neon-btn">🛒 <span id="fdk-cart-count" style="margin-left:8px;background:rgba(0,0,0,0.12);padding:2px 6px;border-radius:999px;font-weight:700;">0</span></button>
    <div id="fdk-user-area"></div>
  `;
  header.appendChild(wrapper);
  document.getElementById("fdk-cart-btn").addEventListener("click", openCartDrawer);
  renderCartCount(); renderHeaderUser();
}

/* render user area */
function renderHeaderUser(){
  const area = document.getElementById("fdk-user-area"); if(!area) return;
  area.innerHTML = "";
  const user = storage.getUser();
  if(user){
    const div = document.createElement("div"); div.style="display:flex;align-items:center;gap:8px;";
    div.innerHTML = `<img src="${user.picture||''}" alt="" style="width:30px;height:30px;border-radius:999px;object-fit:cover;border:2px solid rgba(255,255,255,0.06)"/><span style="font-weight:700;">${user.name}</span><button id="fdk-signout" style="margin-left:6px;background:transparent;border:1px solid rgba(255,255,255,0.06);padding:6px;border-radius:8px;cursor:pointer;">Sign out</button>`;
    area.appendChild(div);
    document.getElementById("fdk-signout").addEventListener("click", ()=>{ storage.clearUser(); renderHeaderUser(); toast("Signed out");});
  } else {
    const btn = document.createElement("button"); btn.id="fdk-signin"; btn.textContent = "Sign in"; btn.style="background:transparent;border:1px solid rgba(255,255,255,0.08);padding:8px 12px;border-radius:10px;cursor:pointer;font-weight:700;";
    area.appendChild(btn);
    btn.addEventListener("click", ()=> {
      if(!GOOGLE_CLIENT_ID){ toast("Google sign-in not configured. (leave GOOGLE_CLIENT_ID blank to skip)"); return; }
      if(window.google && google.accounts && google.accounts.id) google.accounts.id.prompt();
      else toast("Google script loading... try again");
    });
  }
}

/* ========== Products list rendering (cards) ========== */
function renderProductCards(){
  const container = document.getElementById("products") || document.querySelector(".products-grid");
  if(!container) return;
  // clear
  container.innerHTML = "";
  const grid = document.createElement("div"); grid.className = "fdk-products-grid flex flex-wrap -mx-4 justify-center gap-4";
  PRODUCT_LIST.forEach(p=>{
    const card = document.createElement("div"); card.className = "p-4 md:w-1/3 lg:w-1/4 w-full";
    card.innerHTML = `
      <div class="fdk-3d-card h-full glass rounded-2xl p-4 neon-card" style="transition:all .35s;">
        <div class="relative overflow-hidden rounded-xl">
          <img src="${p.images[0]}" alt="${p.title}" class="w-full h-48 object-cover rounded-xl mb-2"/>
        </div>
        <h3 class="text-lg font-semibold text-pink-300">${p.title}</h3>
        <p class="text-sm text-gray-300 mt-1">${p.desc}</p>
        <div class="mt-4 flex items-center justify-between">
          <span class="text-lg font-bold">$${p.price.toFixed(2)}</span>
          <div style="display:flex;gap:8px;">
            <button class="fdk-view-btn fdk-neon-btn" data-id="${p.id}" style="padding:6px 10px;border-radius:999px;border:0;cursor:pointer;">View</button>
            <button class="fdk-add-btn fdk-neon-btn" data-id="${p.id}" style="padding:6px 10px;border-radius:999px;border:0;cursor:pointer;">Add</button>
          </div>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
  container.appendChild(grid);
  // events
  $all(".fdk-add-btn").forEach(b => b.addEventListener("click", e => addToCart(e.currentTarget.dataset.id,1)));
  $all(".fdk-view-btn").forEach(b => b.addEventListener("click", e => {
    const id = e.currentTarget.dataset.id;
    const detailPage = "product-detail.html";
    if(location.pathname.endsWith("product-detail.html")) { renderProductDetail(id); window.scrollTo({top:0,behavior:'smooth'}); }
    else location.href = `${detailPage}?id=${encodeURIComponent(id)}`;
  }));
}

/* ========== Product detail rendering ========== */
function renderProductDetail(productId){
  if(!productId) productId = new URLSearchParams(location.search).get("id") || PRODUCT_LIST[0].id;
  const p = PRODUCT_LIST.find(x=>x.id===productId); if(!p) return;
  const titleEl = document.getElementById("productTitle");
  const descEl = document.getElementById("productDescription");
  const priceEl = document.getElementById("productPrice");
  const featuresEl = document.getElementById("productFeatures");
  const mainImage = document.getElementById("mainImage");
  const thumbs = document.getElementById("thumbnails");
  if(titleEl) titleEl.innerText = p.title;
  if(descEl) descEl.innerText = p.desc;
  if(priceEl) priceEl.innerText = `$${p.price.toFixed(2)}`;
  if(featuresEl){ featuresEl.innerHTML = ""; (p.features||[]).forEach(f=>{ const li=document.createElement("li"); li.innerText=f; featuresEl.appendChild(li); }); }
  if(mainImage) mainImage.src = p.images[0] || "";
  if(thumbs){ thumbs.innerHTML = ""; p.images.forEach(img=>{ const t=document.createElement("img"); t.src=img; t.className="w-16 h-16 object-cover rounded cursor-pointer"; t.onclick=()=> mainImage.src=img; thumbs.appendChild(t); }); }
  const addBtn = document.getElementById("addToCartBtn"); if(addBtn) addBtn.onclick = ()=> addToCart(p.id,1);
  // ensure reviews display
  renderReviewsForProduct(p.id);
  bindReviewFormIfExists(p.id);
  // fancy 3D effect on hero image if featured3d true
  if(p.featured3d){
    if(mainImage) mainImage.classList.add("product-3d");
  }
}

/* ========== Reviews handling (interactive stars) ========== */
/* create interactive star widget inside a container element (for forms) */
function createStarWidget(container, initial=0, onChange){
  container.innerHTML = ""; container.classList.add("fdk-stars");
  for(let i=1;i<=5;i++){
    const span = document.createElement("span"); span.className="fdk-star"; span.dataset.value = i;
    span.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 .587l3.668 7.431L23.4 9.8l-5.6 5.457L19.335 24 12 19.897 4.665 24l1.535-8.743L.6 9.8l7.732-1.782L12 .587z"/></svg>`;
    container.appendChild(span);
  }
  const stars = Array.from(container.querySelectorAll(".fdk-star"));
  function setVisual(r){
    stars.forEach(s => s.classList.toggle("filled", Number(s.dataset.value) <= r));
  }
  setVisual(initial);
  let selected = initial;
  stars.forEach(s=>{
    s.addEventListener("mouseenter", ()=> setVisual(Number(s.dataset.value)));
    s.addEventListener("mouseleave", ()=> setVisual(selected));
    s.addEventListener("click", ()=>{
      selected = Number(s.dataset.value);
      setVisual(selected);
      if(typeof onChange==='function') onChange(selected);
    });
  });
  return {
    getRating: () => selected,
    setRating: (r) => { selected = r; setVisual(r); }
  };
}

function renderReviewsForProduct(productId){
  const reviewsContainer = document.getElementById("reviewsContainer");
  if(!reviewsContainer) return;
  const all = storage.getReviews(); const list = all[productId] || [];
  reviewsContainer.innerHTML = "";
  if(list.length===0){ reviewsContainer.innerHTML = `<p class="text-gray-400">No reviews yet. Sign in and be first to review.</p>`; return; }
  // each review card (3D feel)
  list.forEach(r=>{
    const div = document.createElement("div"); div.className="bg-gray-800 p-4 rounded fdk-3d-card";
    const stars = "⭐".repeat(Math.max(0,Math.min(5,Number(r.rating))));
    div.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;"><strong>${r.name}</strong><div style="color:#FFD54D">${stars}</div></div><small style="color:#9CA3AF">${new Date(r.date).toLocaleString()}</small><p style="margin-top:8px">${r.comment}</p>`;
    reviewsContainer.appendChild(div);
  });
}

/* submit review (ensures no duplicate and user bought check optional) */
function submitReview(productId, name, email, rating, comment){
  if(!productId || !email){ toast("Sign in required to submit review."); return; }
  const all = storage.getReviews();
  all[productId] = all[productId] || [];
  // prevent duplicate by same email
  if(all[productId].some(r=>r.email===email)){ toast("You already reviewed this product."); return; }
  const review = { email, name, rating: Number(rating), comment, date: new Date().toISOString() };
  all[productId].push(review);
  storage.saveReviews(all);
  renderReviewsForProduct(productId);
  toast("Review submitted — shukriya!");
}

/* bind review form: replaces rating input with interactive stars */
function bindReviewFormIfExists(productId){
  const form = document.getElementById("reviewForm");
  if(!form) return;
  // create star widget area if not present
  let starArea = document.getElementById("fdk-star-area");
  if(!starArea){
    starArea = document.createElement("div"); starArea.id="fdk-star-area"; starArea.style="margin-top:8px;margin-bottom:6px;";
    const ratingInput = document.createElement("input"); ratingInput.type="hidden"; ratingInput.id="reviewRating"; ratingInput.value="5";
    form.insertBefore(starArea, form.querySelector("input[type='text']") || form.firstChild);
    form.appendChild(ratingInput);
  }
  const starWidget = createStarWidget(starArea, 5, v => { const ratingInp = document.getElementById("reviewRating"); if(ratingInp) ratingInp.value = v; });
  form.removeEventListener && form.removeEventListener('submit', form._fdk_submit_handler);
  form._fdk_submit_handler = function(e){
    e.preventDefault();
    const user = storage.getUser();
    if(!user){ toast("Sign in required to submit review."); return; }
    const name = user.name || user.email.split("@")[0];
    const rating = document.getElementById("reviewRating").value || 5;
    const comment = (document.getElementById("reviewComment") || {}).value || "";
    submitReview(productId, name, user.email, rating, comment);
    form.reset();
    starWidget.setRating(5);
  };
  form.addEventListener("submit", form._fdk_submit_handler);
}

/* ========== Cart logic (same as before) ========== */
function addToCart(productId, qty=1){
  const cart = storage.getCart(); const product = PRODUCT_LIST.find(p=>p.id===productId);
  if(!product){ toast("Product not found"); return; }
  const existing = cart.find(c=>c.id===productId);
  if(existing) existing.qty += qty; else cart.push({ id: productId, qty });
  storage.saveCart(cart);
  renderCartCount();
  renderCartDrawer();
  toast(`${product.title} added to cart`);
}
function removeFromCart(productId){ let cart = storage.getCart(); cart = cart.filter(c=>c.id!==productId); storage.saveCart(cart); renderCartCount(); renderCartDrawer(); }
function updateCartQty(productId, qty){ const cart = storage.getCart(); const item = cart.find(c=>c.id===productId); if(item) item.qty = Math.max(1, qty); storage.saveCart(cart); renderCartCount(); renderCartDrawer(); }
function renderCartCount(){ const span = document.getElementById("fdk-cart-count"); if(!span) return; const cart = storage.getCart(); const total = cart.reduce((s,i)=> s + i.qty, 0); span.textContent = total; }

/* Cart drawer creation & render */
function openCartDrawer(){
  let d = document.getElementById("fdk-cart-drawer");
  if(!d){
    d = document.createElement("div"); d.id="fdk-cart-drawer"; d.style="position:fixed;right:20px;bottom:20px;width:380px;max-width:96vw;background:linear-gradient(180deg,rgba(7,10,20,0.98),rgba(7,10,20,0.96));color:#e6eef8;padding:14px;border-radius:12px;box-shadow:0 30px 80px rgba(0,0,0,0.7);z-index:99999;";
    d.innerHTML = `<h3 style="font-weight:800;margin-bottom:10px">Your Cart <button id="fdk-cart-close" style="float:right;background:transparent;border:0;color:#fff;font-size:16px;cursor:pointer">✕</button></h3><div id="fdk-cart-items" style="max-height:320px;overflow:auto"></div><div style="margin-top:10px;display:flex;gap:8px;justify-content:space-between;align-items:center;"><div><strong>Total:</strong> <span id="fdk-cart-total">$0</span></div><div style="display:flex;gap:8px;"><button id="fdk-checkout" class="fdk-neon-btn" style="background:#FFD54D;padding:8px 12px;border-radius:8px;border:0;cursor:pointer;font-weight:700">Checkout</button></div></div>`;
    document.body.appendChild(d);
    document.getElementById("fdk-cart-close").addEventListener("click", ()=> d.remove());
    document.getElementById("fdk-checkout").addEventListener("click", checkout);
  }
  renderCartDrawer();
}
function closeCartDrawer(){ const dd = document.getElementById("fdk-cart-drawer"); if(dd) dd.remove(); }
function renderCartDrawer(){
  const itemsDiv = document.getElementById("fdk-cart-items"); if(!itemsDiv) return;
  const cart = storage.getCart(); itemsDiv.innerHTML=""; let total=0;
  if(cart.length===0) itemsDiv.innerHTML = `<p style="color:#9CA3AF">Your cart is empty</p>`;
  else {
    cart.forEach(ci=>{
      const p = PRODUCT_LIST.find(pp=>pp.id===ci.id); if(!p) return;
      const row = document.createElement("div");
      row.style="display:flex;gap:10px;align-items:center;padding:8px;border-radius:8px;margin-bottom:8px;background:rgba(255,255,255,0.02)";
      row.innerHTML = `<img src="${p.images[0]}" style="width:64px;height:64px;object-fit:cover;border-radius:8px"/><div style="flex:1"><strong>${p.title}</strong><div style="color:#9CA3AF">$${p.price.toFixed(2)} x <input type='number' min='1' value='${ci.qty}' class='fdk-qty' data-id='${p.id}' style='width:56px;margin-left:8px;padding:4px;border-radius:6px;background:#071028;color:#fff;border:1px solid rgba(255,255,255,0.04)' /></div></div><button class='fdk-remove' data-id='${p.id}' style='background:transparent;border:0;color:#fff;cursor:pointer'>Remove</button>`;
      itemsDiv.appendChild(row);
      total += p.price * ci.qty;
    });
  }
  document.getElementById("fdk-cart-total").textConte
