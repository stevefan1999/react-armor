const { describe, it } = global;
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import _ from 'lodash';
import postcss from 'postcss';
import should from 'should/as-function';

import { obfuscateClassNames } from '..';
const { obfuscateClassName, obfuscateClassNamesInSelector, createPostCSSPlugin } = obfuscateClassNames;

const seed = 'foobar';

describe('obfuscateClassNames', () => {
  describe('.obfuscateClassName', () => {
    it('hashes class name', () => {
      const actual = obfuscateClassName({ seed })('App');
      const expected = 'b3411db7';
      should(actual).be.exactly(expected);
    });
  });
  describe('.obfuscateClassNamesInSelector', () => {
    it('hashes complex selectors', () => {
      const obfuscated = _(['App', 'Component', 'state'])
        .map((className) => [className, obfuscateClassName({ seed })(className)])
      .fromPairs()
      .value();
      const actual = obfuscateClassNamesInSelector({ seed })('.App .Component[attr=\'val\'].state:hover');
      const expected = `.${obfuscated.App} .${obfuscated.Component}[attr='val'].${obfuscated.state}:hover`;
      should(actual).be.exactly(expected);
    });
  });
  describe('.createPostCSSPlugin', () => {
    it('transforms complex stylesheets', () => {
      const plugin = createPostCSSPlugin(postcss);
      const obfuscated = _(['Foo', 'Bar', 'state', 'Bar--module'])
        .map((className) => [className, obfuscateClassName({ seed })(className)])
      .fromPairs()
      .value();
      const originalCss = `
        .Foo .Bar[attr='val'].Bar--module:hover {
          background-color: 'red';
        }
        ul li .Bar--module.Bar:visited {
          background-color: 'green';
        }
      `;
      const transformedCss = postcss([plugin({ seed })]).process(originalCss).css;
      const expectedCss = `
        .${obfuscated.Foo} .${obfuscated.Bar}[attr='val'].${obfuscated['Bar--module']}:hover {
          background-color: 'red';
        }
        ul li .${obfuscated['Bar--module']}.${obfuscated.Bar}:visited {
          background-color: 'green';
        }
      `;
      should(transformedCss).be.exactly(expectedCss);
    });
  });
  describe('.obfuscateClassNames', () => {
    it('obfuscates deeply nested classNames', () => {
      const obfuscated = _(['Bar', 'Foo'])
        .map((className) => [className, obfuscateClassName({ seed })(className)])
      .fromPairs()
      .value();

      function Bar() {
        return <div className='Bar'>{'bar'}</div>;
      }

      @obfuscateClassNames({ seed })
      class Foo extends React.Component {
        render() {
          return <div className='Foo'><Bar /></div>;
        }
      }

      const actual = ReactDOMServer.renderToStaticMarkup(<Foo />);
      const expected = ReactDOMServer.renderToStaticMarkup(
        <div className={obfuscated.Foo}>
          <div className={obfuscated.Bar}>
            {'bar'}
          </div>
        </div>
      );
      should(actual).be.exactly(expected);
    });

    it('obfuscates top-level React Elements', () => {
      const obfuscated = _(['Bar', 'Foo'])
        .map((className) => [className, obfuscateClassName({ seed })(className)])
      .fromPairs()
      .value();

      function Bar() {
        return <div className='Bar'>{'bar'}</div>;
      }

      class Foo extends React.Component {
        render() {
          return <div className='Foo'><Bar /></div>;
        }
      }

      const actual = ReactDOMServer.renderToStaticMarkup(obfuscateClassNames({ seed })(
        <Foo />
      ));
      const expected = ReactDOMServer.renderToStaticMarkup(
        <div className={obfuscated.Foo}>
          <div className={obfuscated.Bar}>
            {'bar'}
          </div>
        </div>
      );
      should(actual).be.exactly(expected);
    });
  });
});
