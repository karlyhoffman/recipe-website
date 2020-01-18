/* eslint-disable prettier/prettier */
import React from 'react';
import Head from 'next/head';
import App from 'next/app';
import Navbar from '../components/navbar';
import '../styles/main.scss';

export default class RecipeApp extends App {
  render() {
    const { Component, pageProps } = this.props;

    return (
      <>
        <Head>
          <title>5047 Cooking</title>
          <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png" />
          <link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon-32x32.png" />
          <link rel="icon" type="image/png" sizes="16x16" href="/favicon/favicon-16x16.png" />
          <link rel="manifest" href="/favicon/site.webmanifest" />
          <link rel="mask-icon" href="/favicon/safari-pinned-tab.svg" color="#cc8b0e" />
          <meta name="msapplication-TileColor" content="#00aba9" />
          <meta name="theme-color" content="#ffffff" />
        </Head>
        <Navbar />
        <Component {...pageProps} />
      </>
    );
  }
}
