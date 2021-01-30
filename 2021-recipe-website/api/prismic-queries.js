import PrismicLib from 'prismic-javascript';
import { Client } from 'api/prismic-configuration';

export const Prismic = PrismicLib;

export const fetchSingleDocumentByType = async ({ type, req, options }) =>
  Client(req).getSingle(type, options);

export const fetchMultipleDocumentsByType = async ({ type, req, options, predicates = [] }) =>
  Client(req).query(
    [Prismic.Predicates.at('document.type', type), ...predicates],
    options
  );