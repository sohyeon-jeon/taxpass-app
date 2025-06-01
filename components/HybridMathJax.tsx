import React from 'react';
import { Platform, View } from 'react-native';
import { MathJax, MathJaxContext } from 'better-react-mathjax';
import AutoHeightWebView from 'react-native-autoheight-webview';

type Props = {
  latex: string;
  fontSize?: number;
  display?: boolean;
};

export default function HybridMathJax({ latex, fontSize = 16, display = false }: Props) {
  if (Platform.OS === 'web' && MathJaxContext && MathJax) {
    return (
      <MathJaxContext
        version={3}
        config={{
          loader: { load: ['[tex]/ams'] },
          tex: {
            inlineMath: [['$', '$'], ['\\(', '\\)']],
            displayMath: [['$$', '$$'], ['\\[', '\\]']],
            packages: ['base', 'ams'],
          },
          chtml: {
            displayAlign: 'left',
          },
        }}
      >
        <MathJax inline={!display}>{latex}</MathJax>
      </MathJaxContext>
    );
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <!-- Load web font for iOS serif compatibility -->
        <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR&display=swap" rel="stylesheet">
        <style>
          html, body {
            margin: 0;
            padding: 0;
            font-size: ${fontSize}px;
            background-color: transparent;
            text-align: left;
            font-family: 'Noto Serif KR', Georgia, Times, serif;
          }
        </style>
        <script>
          window.MathJax = {
            tex: {
              inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
              displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']],
            },
            startup: {
              typeset: true,
              ready: () => {
                MathJax.startup.defaultReady();
              }
            }
          };
        </script>
        <script defer src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js"></script>
      </head>
      <body>
        ${latex}
      </body>
    </html>
  `;

  return (
    <View style={{ minHeight: 10 }}>
      <AutoHeightWebView
        originWhitelist={['*']}
        source={{ html }}
        style={{ width: '100%', backgroundColor: 'transparent' }}
        customStyle={''}
        scrollEnabled={false}
      />
    </View>
  );
}
