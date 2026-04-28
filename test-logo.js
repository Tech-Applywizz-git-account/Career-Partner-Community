import { getCompanyLogo } from './src/utils/logoHelper.js';

const test = (name) => {
    console.log(`Testing: ${name}`);
    console.log(`URL: ${getCompanyLogo(name)}`);
    console.log('---');
};

test('Google');
test('Microsoft');
test('Amazon');
test('Meta');
test('Apple');
test('Uber');
test('Tesla');
test('Sewell');
test('Mission.dev');
test('Nestlé');
test('Nestle');
test('The Walt Disney Company');
