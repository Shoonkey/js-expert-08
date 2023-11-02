import Fastify from "fastify";
import MultipartPlugin from "@fastify/multipart";
import CorsPlugin from "@fastify/cors";
import { pipeline } from "node:stream/promises";
import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

const app = Fastify({
  logger: {
    transport: {
      target: "pino-pretty",
      options: {
        ignore: "pid,hostname",
      },
    },
  },
});

app.register(MultipartPlugin);
app.register(CorsPlugin, {
  origin: (origin, cb) => {
    const notAllowedError = new Error("Not allowed");

    if (!origin) {
      cb(notAllowedError, false);
      return;
    }

    const { hostname } = new URL(origin);

    if (hostname === "localhost") {
      cb(null, true);
      return;
    }

    cb(notAllowedError, false);
  },
  methods: ["OPTIONS", "POST"]
});

app.options("/", async (_request, reply) => {
  reply
    .header("Access-Control-Allow-Origin", "*")
    .header("Access-Control-Allow-Methods", "OPTIONS, POST")
    .status(204);
});

app.post("/", async (request, reply) => {
  try {
    const data = await request.file();
  
    if (!data) {
      reply.status(400);
      return;
    }

    const downloadsFolder = join(process.cwd(), "downloads");
    await mkdir(downloadsFolder, { recursive: true });

    request.log.info(`Uploading ${data.fieldname}`);

    const filePath = join(downloadsFolder, data.fieldname);
    await pipeline(data.file, createWriteStream(filePath));

    request.log.info(`File upload of ${data.fieldname} finished!`);
  } catch (err) {
    request.log.error(err);
    reply.status(400);
  }
});

async function start() {
  try {
    const port = Number(process.env.PORT) || 3000;
    await app.listen({ port });
  } catch (err) {
    app.log.error(err);
  }
}

start();
