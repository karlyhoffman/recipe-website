import PrismicLib from 'prismic-javascript';
import { Client } from 'api/prismic-configuration';

export const Prismic = PrismicLib;

export const fetchSingleDocumentByType = async ({ type, req, options }) =>
  Client(req).getSingle(type, options);
