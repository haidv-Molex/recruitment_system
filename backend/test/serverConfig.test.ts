import express from "express";
import pactum from "pactum";
import { app } from "@/serverConfig";

describe("serverConfig CORS matching", () => {
  let server: any;
  let port: number;
  let expectLocal: any;

  before(async () => {
    const { expect: localExpect } = await new Function('specifier', 'return import(specifier)')('chai');
    expectLocal = localExpect;

    // Define a simple endpoint specifically for testing CORS behavior
    app.get("/test-cors-endpoint", (req, res) => {
      res.status(200).send("OK");
    });

    await new Promise<void>((resolve) => {
      server = app.listen(0, "127.0.0.1", () => {
        const address: any = server.address();
        port = address.port;
        pactum.request.setBaseUrl(`http://127.0.0.1:${port}`);
        resolve();
      });
    });
  });

  after((done) => {
    server.close(done);
  });

  it("should allow request from whitelisted clientUrl (e.g. http://localhost:5173)", async () => {
    const response = await pactum.spec()
      .get("/test-cors-endpoint")
      .withHeaders("Origin", "http://localhost:5173")
      .expectStatus(200);

    expectLocal(response.headers["access-control-allow-origin"]).to.equal("http://localhost:5173");
  });

  it("should allow request from exact http://mlxvhavwpapp4.molex.com", async () => {
    const response = await pactum.spec()
      .get("/test-cors-endpoint")
      .withHeaders("Origin", "http://mlxvhavwpapp4.molex.com")
      .expectStatus(200);

    expectLocal(response.headers["access-control-allow-origin"]).to.equal("http://mlxvhavwpapp4.molex.com");
  });

  it("should allow request from http://mlxvhavwpapp4.molex.com with a port", async () => {
    const response = await pactum.spec()
      .get("/test-cors-endpoint")
      .withHeaders("Origin", "http://mlxvhavwpapp4.molex.com:8080")
      .expectStatus(200);

    expectLocal(response.headers["access-control-allow-origin"]).to.equal("http://mlxvhavwpapp4.molex.com:8080");
  });

  it("should allow request from https://mlxvhavwpapp4.molex.com with a port", async () => {
    const response = await pactum.spec()
      .get("/test-cors-endpoint")
      .withHeaders("Origin", "https://mlxvhavwpapp4.molex.com:3000")
      .expectStatus(200);

    expectLocal(response.headers["access-control-allow-origin"]).to.equal("https://mlxvhavwpapp4.molex.com:3000");
  });

  it("should NOT allow request from attacker.com", async () => {
    await pactum.spec()
      .get("/test-cors-endpoint")
      .withHeaders("Origin", "http://attacker.com")
      .expectStatus(500);
  });

  it("should NOT allow request from subdomain takeover / hijack attempt (e.g. mlxvhavwpapp4.molex.com.attacker.com)", async () => {
    await pactum.spec()
      .get("/test-cors-endpoint")
      .withHeaders("Origin", "http://mlxvhavwpapp4.molex.com.attacker.com")
      .expectStatus(500);
  });
});
