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
          <title>Reach Dev Showcase</title>
        </Head>
        <Navbar />
        <Component {...pageProps} />
      </>
    );
  }
}
