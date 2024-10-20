import connectToMongoDB from "./config/mongodb.js";
import server from "./index.js";

server.listen(3600, () => {
    connectToMongoDB();
    console.log(`server is running at port 3600`);
});
