suite('normalize', () => {
  const utils = require('../src');
  const assert = require('assert');
  const _ = require('lodash');

  suite('scope comparing', function() {
    const cmp = (a, b) => {
      if (a < b) {
        return -1;
      } else if (a > b) {
        return 1;
      } else {
        return 0;
      }
    };
    const SYMBOLIC = {
      '-1': '<',
      0: '===',
      1: '>',
    };

    const testTotalOrder = ({title, scopes}) => {
      _.range(scopes.length).forEach(i => {
        _.range(scopes.length).forEach(j => {
          // scopeCompare doesn't return 0, so don't test that
          if (i === j) {
            return;
          }
          let exp = cmp(i, j);
          test(`${title} - ${scopes[i]} ${SYMBOLIC[exp]} ${scopes[j]}`, () => {
            assert.equal(
              SYMBOLIC[utils.scopeCompare(scopes[i], scopes[j])],
              SYMBOLIC[exp],
              `expected ${scopes[i]} ${SYMBOLIC[exp]} ${scopes[j]}`);
          });
        });
      });
    };

    testTotalOrder({
      title: 'simple example of total order',
      scopes: [
        'abc*',
        'abc',
        'abc%d',
      ],
    });

    testTotalOrder({
      title: 'stars',
      scopes: [
        '*',
        '',
        '**',
        '***',
        '****',

        'aaa*',
        'aaa',
        'aaa**',
        'aaa***',
        'aaa****',
        'aaa*****',
      ],
    });

    testTotalOrder({
      title: 'all character combos',
      scopes: [
        'x*',
        'x',

        'x%*',
        'x%',
        'x%%',
        'x%a',

        'x**',
        'x*%',
        'x*a',

        'xa*',
        'xa',
        'xa%',
        'xaa',
      ],
    });
  });

  suite('scope sorting', function() {
    const testSortScopes = ({title, scopes, expected, N}) => {
      title = title || 'sort scopes ' + scopes.join(',');
      test(title, () => {
        _.range(N || 50).forEach(() => {
          scopes = _.shuffle(scopes);
          scopes.sort(utils.scopeCompare);
          assert.deepEqual(expected, scopes);
        });
      });
    };

    testSortScopes({
      scopes: [
        'test-12',
        'test-2',
        'test-11',
        'test-1',
        'test-1*',
        'test-13',
        'test-3',
        'test-10',
        'test-*',
      ],
      expected: [
        'test-*',
        'test-1*',
        'test-1',
        'test-10',
        'test-11',
        'test-12',
        'test-13',
        'test-2',
        'test-3',
      ],
    });

    testSortScopes({
      scopes: [
        'test*a',
        'test*b',
        'test*',
        'test',
        'testb',
      ],
      expected: [
        'test*',
        'test',
        'test*a',
        'test*b',
        'testb',
      ],
    });

    testSortScopes({
      scopes: [
        'abc',
        //'abc%d',
        'abc*',
        'abc*d',
        'ab',
        'abcd',
      ],
      expected: [
        'ab',
        'abc*',
        'abc',
        //'abc%d',
        'abc*d',
        'abcd',
      ],
    });

    testSortScopes({
      scopes: ['(', '*', ''],
      expected: ['*', '', '('],
    });

    testSortScopes({
      scopes: ['ab(', 'ab*', 'aa'],
      expected: ['aa', 'ab*', 'ab('],
    });

    const sortedRoleIds = [
      '*', 'a*', 'a', 'aa', 'aaa', 'aab', 'ab', 'abb*', 'abb', 'abbc', 'ca',
      'caa', 'cab*', 'cab', 'cc*',
    ];
    testSortScopes({
      title: 'big list',
      scopes: _.shuffle(sortedRoleIds),
      expected: sortedRoleIds,
    });
  });

  suite('normalizeScopeSet', function() {
    test('empty set', function() {
      assert.deepEqual([],
        utils.normalizeScopeSet([]));
    });

    test('already normalized', function() {
      assert.deepEqual(['a*', 'b*'],
        utils.normalizeScopeSet(['a*', 'b*']));
    });

    test('not normalized', function() {
      const unnormalized = ['abc', 'abx*', 'ab*', 'b', 'b*'];
      unnormalized.sort(utils.scopeCompare);
      assert.deepEqual(['ab*', 'b*'],
        utils.normalizeScopeSet(unnormalized));
    });

    test('not normalized, contains duplicates', function() {
      const unnormalized = ['abc', 'abx*', 'ab*', 'b', 'b*', 'abc*'];
      unnormalized.sort(utils.scopeCompare);
      assert.deepEqual(['ab*', 'b*'],
        utils.normalizeScopeSet(unnormalized));
    });

    test('not normalized, contains lots of duplicates', function() {
      const unnormalized = ['abc', 'abx*', 'ab*', 'b', 'b*', 'abc*', 'b*',
        'b*', 'b*', 'b*'];
      unnormalized.sort(utils.scopeCompare);
      assert.deepEqual(['ab*', 'b*'],
        utils.normalizeScopeSet(unnormalized));
    });
  });

  suite('scopeset merging', function() {
    const testMergeScopeSets = (title, {scopesA, scopesB, expected, N}) => {
      test('mergeScopeSets (' + title + ')', () => {
        _.range(N || 50).forEach(() => {
          scopesA.sort(utils.scopeCompare);
          scopesB.sort(utils.scopeCompare);
          assert.deepEqual(expected, utils.mergeScopeSets(scopesA, scopesB));
          // Shuffle for next round
          scopesA = _.shuffle(scopesA);
          scopesB = _.shuffle(scopesB);
        });
      });
    };

    testMergeScopeSets('simple sort', {
      scopesA: ['a', 'b', 'c'],
      scopesB: [],
      expected: ['a', 'b', 'c'],
    });

    testMergeScopeSets('simple sort w. star', {
      scopesA: ['a*', 'b', 'c'],
      scopesB: [],
      expected: ['a*', 'b', 'c'],
    });

    testMergeScopeSets('complex sort', {
      scopesA: [
        'assume:tr-0',
        'assume:tr-1',
        'assume:tr-10',
        'assume:tr-2',
        'assume:tr-3',
        'assume:tr-4',
        'assume:tr-5',
        'assume:tr-6',
        'assume:tr-7',
        'assume:tr-8',
        'assume:tr-9',
        'special-scope',
      ],
      scopesB: [],
      expected: [
        'assume:tr-0',
        'assume:tr-1',
        'assume:tr-10',
        'assume:tr-2',
        'assume:tr-3',
        'assume:tr-4',
        'assume:tr-5',
        'assume:tr-6',
        'assume:tr-7',
        'assume:tr-8',
        'assume:tr-9',
        'special-scope',
      ],
    });

    testMergeScopeSets('can normalize', {
      scopesA: ['b*', 'ab', 'aa', 'a', 'a*'],
      scopesB: [],
      expected: ['a*', 'b*'],
    });

    testMergeScopeSets('can normalize', {
      scopesA: ['b*', 'ab', 'aa', 'a*'],
      scopesB: [],
      expected: ['a*', 'b*'],
    });

    testMergeScopeSets('sanity check (1)', {
      scopesA: ['assume:tr-10', 'assume:tr-9', 'special-scope'],
      scopesB: [],
      expected: ['assume:tr-10', 'assume:tr-9', 'special-scope'],
    });

    testMergeScopeSets('sanity check (2)', {
      scopesA: [],
      scopesB: ['assume:tr-10', 'assume:tr-9', 'special-scope'],
      expected: ['assume:tr-10', 'assume:tr-9', 'special-scope'],
    });

    testMergeScopeSets('can normalize two', {
      scopesA: ['b*', 'ab', 'aa', 'a*', 'c', 'ca', 'da*'],
      scopesB: ['b*', 'ab', 'aa', 'a*', 'abc', 'ab*', 'ca', 'daa'],
      expected: ['a*', 'b*', 'c', 'ca', 'da*'],
    });
  });
});
