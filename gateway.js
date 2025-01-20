const { ApolloServer } = require("apollo-server");
const { ApolloGateway } = require("@apollo/gateway");

const gateway = new ApolloGateway({
  serviceList: [
    { name: "products", url: "http://localhost:8080/graphql" }, //

    { name: "users", url: "http://localhost:8081/graphql" }, //

    { name: "orders", url: "http://localhost:8082/graphql" }, //
    // // Federated Kotlin GraphQL Service
  ],
});

const server = new ApolloServer({
  gateway,
  subscriptions: false, // Subscriptions are not supported in Apollo Gateway
});

server.listen().then(({ url }) => {
  console.log(`🚀 Apollo Gateway running at ${url}`);
});
