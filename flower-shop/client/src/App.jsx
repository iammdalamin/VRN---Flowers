import { useEffect, useMemo, useState } from "react";
const CUR = "₽"; // change currency symbol here
const api = async (url, opts = {}, key) => {
  const r = await fetch(url, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(key && { "x-admin-key": key }),
    },
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || "Something went wrong");
  return data;
};

export default function App() {
  const [view, setView] = useState("shop");
  const [flowers, setFlowers] = useState([]);
  const [cat, setCat] = useState("All");
  const [cart, setCart] = useState({}); // {id: qty}
  const [error, setError] = useState("");
  useEffect(() => {
    api("/api/flowers")
      .then(setFlowers)
      .catch((e) => setError(e.message));
  }, []);
  const cats = ["All", ...new Set(flowers.map((f) => f.category))];
  const items = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, qty]) => ({ ...flowers.find((f) => f.id === +id), qty }))
        .filter((i) => i.id),
    [cart, flowers],
  );
  const count = items.reduce((s, i) => s + i.qty, 0),
    total = items.reduce((s, i) => s + i.qty * i.price, 0);
  const add = (id) => setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));
  const change = (id, d) =>
    setCart((c) => {
      const q = (c[id] || 0) + d,
        n = { ...c };
      q > 0 ? (n[id] = q) : delete n[id];
      return n;
    });

  return (
    <>
      <header>
        <div className="wrap">
          <h2 style={{ cursor: "pointer" }} onClick={() => setView("shop")}>
            VRN – Flowers
          </h2>
          <nav>
            <button className="btn ghost" onClick={() => setView("admin")}>
              Admin
            </button>
            <button className="btn" onClick={() => setView("cart")}>
              Cart<span className="cartbadge">{count}</span>
            </button>
          </nav>
        </div>
      </header>
      <main className="wrap">
        {error && (
          <p className="msg err">
            {error}. Is the server running on port 4000?
          </p>
        )}
        {view === "shop" && (
          <>
            <section className="hero">
              <h1>Flowers cut this morning.</h1>
              <p>
                Order by noon and we deliver the same day, wrapped and ready to
                give.
              </p>
            </section>
            <div className="tabs">
              {cats.map((c) => (
                <button
                  key={c}
                  className={"tab" + (c === cat ? " on" : "")}
                  onClick={() => setCat(c)}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="grid">
              {flowers
                .filter((f) => cat === "All" || f.category === cat)
                .map((f) => (
                  <article className="card" key={f.id}>
                    <div
                      className="pic"
                      style={{ background: f.color }}
                      aria-hidden
                    >
                      {f.emoji}
                    </div>
                    <div className="body">
                      <h3>{f.name}</h3>
                      <p>{f.desc}</p>
                      <div className="row">
                        <span className="price">
                          {CUR}
                          {f.price}
                        </span>
                        <button className="btn" onClick={() => add(f.id)}>
                          Add to cart
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
            </div>
          </>
        )}
        {view === "cart" && (
          <Cart
            items={items}
            total={total}
            change={change}
            onDone={() => {
              setCart({});
            }}
            back={() => setView("shop")}
          />
        )}
        {view === "admin" && (
          <Admin onChanged={() => api("/api/flowers").then(setFlowers)} />
        )}
      </main>
    </>
  );
}

function Cart({ items, total, change, onDone, back }) {
  const [f, setF] = useState({ name: "", phone: "", address: "", note: "" });
  const [msg, setMsg] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    try {
      const o = await api("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          ...f,
          items: items.map((i) => ({ id: i.id, qty: i.qty })),
        }),
      });
      setMsg({
        ok: true,
        text: `Order #${o.id} placed. Total ${CUR}${o.total}. We will call you to confirm.`,
      });
      onDone();
    } catch (err) {
      setMsg({ ok: false, text: err.message });
    }
  };
  return (
    <div className="panel">
      <h2>Your cart</h2>
      {msg && <p className={"msg " + (msg.ok ? "ok" : "err")}>{msg.text}</p>}
      {!items.length && !msg?.ok && (
        <p>
          Your cart is empty.{" "}
          <button className="btn" onClick={back}>
            Browse flowers
          </button>
        </p>
      )}
      {items.map((i) => (
        <div className="line" key={i.id}>
          <span>
            {i.emoji} {i.name}
          </span>
          <span className="qty">
            <button aria-label="Remove one" onClick={() => change(i.id, -1)}>
              −
            </button>
            {i.qty}
            <button aria-label="Add one" onClick={() => change(i.id, 1)}>
              +
            </button>
          </span>
          <strong>
            {CUR}
            {i.qty * i.price}
          </strong>
        </div>
      ))}
      {!!items.length && (
        <>
          <p className="row">
            <span>Total</span>
            <strong className="price">
              {CUR}
              {total}
            </strong>
          </p>
          <form onSubmit={submit}>
            <label>
              Full name
              <input required value={f.name} onChange={set("name")} />
            </label>
            <label>
              Phone
              <input
                required
                type="tel"
                value={f.phone}
                onChange={set("phone")}
              />
            </label>
            <label>
              Delivery address
              <textarea
                required
                rows="2"
                value={f.address}
                onChange={set("address")}
              />
            </label>
            <label>
              Card message (optional)
              <input value={f.note} onChange={set("note")} />
            </label>
            <button className="btn">Place order</button>
          </form>
        </>
      )}
    </div>
  );
}

function Admin({ onChanged }) {
  const [key, setKey] = useState(""),
    [orders, setOrders] = useState(null),
    [err, setErr] = useState("");
  const [nf, setNf] = useState({
    name: "",
    price: "",
    category: "Bouquets",
    emoji: "💐",
    desc: "",
  });
  const load = async () => {
    try {
      setOrders(await api("/api/orders", {}, key));
      setErr("");
    } catch (e) {
      setErr(e.message);
    }
  };
  const status = async (id, s) => {
    await api(
      `/api/orders/${id}`,
      { method: "PATCH", body: JSON.stringify({ status: s }) },
      key,
    );
    load();
  };
  const addFlower = async (e) => {
    e.preventDefault();
    try {
      await api(
        "/api/flowers",
        { method: "POST", body: JSON.stringify(nf) },
        key,
      );
      setNf({ ...nf, name: "", price: "", desc: "" });
      onChanged();
    } catch (e) {
      setErr(e.message);
    }
  };
  return (
    <div className="panel">
      <h2>Admin</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          load();
        }}
      >
        <label>
          Admin key
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
          />
        </label>
        <button className="btn">View orders</button>
      </form>
      {err && <p className="msg err">{err}</p>}
      {orders && (
        <>
          <h3 style={{ marginTop: 24 }}>Orders ({orders.length})</h3>
          {!orders.length && <p>No orders yet.</p>}
          {orders.map((o) => (
            <div
              className="line"
              key={o.id}
              style={{ alignItems: "flex-start" }}
            >
              <div>
                <strong>
                  #{o.id} · {o.name}
                </strong>{" "}
                · {o.phone}
                <br />
                {o.address}
                <br />
                {o.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}
                {o.note && (
                  <>
                    <br />
                    Card: {o.note}
                  </>
                )}
              </div>
              <div>
                <strong>
                  {CUR}
                  {o.total}
                </strong>
                <br />
                <select
                  value={o.status}
                  onChange={(e) => status(o.id, e.target.value)}
                >
                  {[
                    "New",
                    "Preparing",
                    "Out for delivery",
                    "Delivered",
                    "Cancelled",
                  ].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
          <h3 style={{ marginTop: 24 }}>Add a flower</h3>
          <form onSubmit={addFlower}>
            <label>
              Name
              <input
                required
                value={nf.name}
                onChange={(e) => setNf({ ...nf, name: e.target.value })}
              />
            </label>
            <label>
              Price
              <input
                required
                type="number"
                min="1"
                value={nf.price}
                onChange={(e) => setNf({ ...nf, price: e.target.value })}
              />
            </label>
            <label>
              Category
              <input
                value={nf.category}
                onChange={(e) => setNf({ ...nf, category: e.target.value })}
              />
            </label>
            <label>
              Emoji
              <input
                value={nf.emoji}
                onChange={(e) => setNf({ ...nf, emoji: e.target.value })}
              />
            </label>
            <label>
              Description
              <input
                value={nf.desc}
                onChange={(e) => setNf({ ...nf, desc: e.target.value })}
              />
            </label>
            <button className="btn">Add flower</button>
          </form>
        </>
      )}
    </div>
  );
}
