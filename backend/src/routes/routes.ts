import { AddBalance } from "../controllers/addBalance";
import { CreateWallet } from "../controllers/createWallet";
import { deleteHandler } from "../controllers/deleteOrder";
import { depthHandler } from "../controllers/depthhandler";
import { fillsHandler } from "../controllers/fillsHandler";
import { getbalance } from "../controllers/getbalance";
import { getAllOrderHandler } from "../controllers/getOrdersHandler";
import { SigninHandler } from "../controllers/LoginHandler";
import { Orderhandler } from "../controllers/OrderHandler";
import { SignupHandler } from "../controllers/SignupHandler";
import { auth } from "../middlewares/auth";
import { app } from "../server";

app.post("/signup", SignupHandler);

app.post("/login", SigninHandler);

app.get("/stocks", (req, res) => {
    res.json({"STOCKS":"stocks"});
});

app.use(auth);

// --- Orders ---
app.post("/order", Orderhandler);

app.delete("/order/:orderId", deleteHandler);

app.get("/orders", getAllOrderHandler);

// --- Market data ---
app.get("/orderbook/:symbol", depthHandler);
  // return aggregated depth — totalQty per price level for bids and asks
  // (don't expose individual userIds to other users)


app.get("/fills/:symbol", fillsHandler);
  // recent trades for this stock — the "tape"


// --- User data ---
app.get("/balance", getbalance);

// create new asset wallet
app.post("/wallet/add", AddBalance);
app.post("/wallet", CreateWallet);
