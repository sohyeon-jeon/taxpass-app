import React from 'react';
import { Platform, Text } from 'react-native';
import { WebView } from 'react-native-webview';

let MathJaxContext: any = null;
let MathJax: any = null;

if (Platform.OS === 'web') {
  try {
    const mathjax = require('better-react-mathjax');
    MathJaxContext = mathjax.MathJaxContext;
    MathJax = mathjax.MathJax;
  } catch (e) {
    console.warn('MathJaxContext 불러오기 실패:', e);
  }
}

type Props = {
  latex: string;
  fontSize?: number;
  display?: boolean; // 블록 수식 여부
};

export default function HybridMathJax({ latex, fontSize = 16, display = false }: Props) {
  // 웹 (React DOM)
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
            fontURL: 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/output/chtml/fonts',
            displayAlign: 'left',
            scale: 1,
          },
          options: {
            renderActions: { addMenu: [] },
          },
        }}
      >
        <MathJax inline={!display}>{latex}</MathJax>
      </MathJaxContext>
    );
  }

  // 앱 (iOS / Android)
  if (Platform.OS !== 'web') {
    const encodedLatex = latex.replace(/\\/g, '\\\\'); // WebView용 이스케이프
    const tag = display ? '\\[' : '\\(';
    const closeTag = display ? '\\]' : '\\)';
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <script type="text/javascript" async
            src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js">
          </script>
          <style>
            body {
              margin: 0;
              padding: 4px;
              font-size: ${fontSize}px;
              font-family: serif;
            }
          </style>
        </head>
        <body>
          ${tag}${encodedLatex}${closeTag}
        </body>
      </html>
    `;
    return (
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        style={{ height: 60, marginVertical: 4, backgroundColor: 'transparent' }}
        scrollEnabled={false}
      />
    );
  }

  // fallback
  return <Text>{latex}</Text>;
}
