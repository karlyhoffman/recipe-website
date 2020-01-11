import PrismicLib from "prismic-javascript";
import { PRISMIC_API_URL, PRISMIC_ACCESS_TOKEN } from "../config.json";

let frontClient;

export const Client = (req = null) => {
  // prevent generate new instance for client side since we don't need the refreshed request object.
  if (!req && frontClient) return frontClient;

  const options = {
    ...(req ? { req } : {}),
    ...(PRISMIC_ACCESS_TOKEN ? { accessToken: PRISMIC_ACCESS_TOKEN } : {})
  };
  return PrismicLib.client(PRISMIC_API_URL, options);
};

export const Prismic = PrismicLib;

export const fetchDocumentsByType = async ({ type, req, options }) =>
  Client(req).query(Prismic.Predicates.at("document.type", type), options);

export const linkResolver = doc => {
  if (doc && doc.type) {
    if (doc.type === "recipe") return `/recipes/${doc.uid}`;
  }
  return "/";
};
