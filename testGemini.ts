import { GoogleGenAI } from "@google/genai";

const client = new GoogleGenAI({
  apiKey: "AQ.Ab8RN6JA3IBM1TzvfWw58rL1_TH_z86c3iupzDwPGrBri2sWNA",
});

async function main() {
  const models = await client.models.list();

  for await (const model of models) {
    console.log(model.name);
  }
}

main().catch(console.error);