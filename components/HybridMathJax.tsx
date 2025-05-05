// components/HybridMathJax.tsx
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
};

export default function HybridMathJax({ latex, fontSize = 16 }: Props) {
  if (Platform.OS === 'web' && MathJaxContext && MathJax) {
    return (
      <MathJaxContext
  version={3}
  config={{
    loader: { load: ['[tex]/ams'] },
    tex: { packages: ['base', 'ams'] },
    chtml: {
      fontURL: 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/output/chtml/fonts',
      displayAlign: 'left',
      scale: 1,
    },
    options: {
      renderActions: {
        addMenu: [],
      },
    }
  }}
>
{/* https://easy-copy-mathjax.nakaken88.com/en/triangle/ */}
{/* <HybridMathJax latex="\\\text{안녕하세요} \\\triangle\\ \\\text{222다음은 법인세에 대한}" /> */}
  <MathJax inline>{`\\(${latex}\\)`}</MathJax>
</MathJaxContext>
    );
  }

  if (Platform.OS !== 'web') {
    const encodedLatex = latex.replace(/\\/g, '\\\\'); // 백슬래시 이스케이프
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <script type="text/javascript" id="MathJax-script" async
            src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js">
          </script>
          <style>
            body {
              margin: 0;
              padding: 4px;
              font-size: ${fontSize}px;
              font-family: serif;
              display: inline;
            }
          </style>
        </head>
        <body>
          \\(${encodedLatex}\\)
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

  return <Text>{latex}</Text>;
}
