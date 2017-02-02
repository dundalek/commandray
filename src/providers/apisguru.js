// @flow
import fs from 'fs';
import _ from 'lodash';
import path from 'path';
import { getSpecs } from '../../../openapi-directory/scripts/util';
import { transformPath } from './pom';

// const absPath = path.resolve(__dirname, '../../../openapi-directory/APIs/') + '/';
// key.replace(absPath, '')

export function transformPath(str) {
  return (str || '').trim().split('/').filter(x => x && x[0] !== '{').join('_').replace(/-/g, '_');
}

// const multipleSpecsProviders = _(specs)
//   .map(({ spec, key }) => spec.info['x-providerName'])
//   .countBy()
//   .map((val, key) => [key, val])
//   .filter(x => x[1] > 1)
//   .map(0)
//   .keyBy()
//   .mapValues(() => true)
  // .value();

const multipleSpecsProviders = { 'azure.com': true,
  'citrixonline.com': true,
  'googleapis.com': true,
  'hetras-certification.net': true,
  'import.io': true,
  'nrel.gov': true,
  'nytimes.com': true,
  'windows.net': true };

function transformParam(param: Object): Param {
  // TODO schema? + dereferencing?

  return {
    name: param.name,
    alias: [],
    schema: {
      type: param.type,
      required: param.required,
      in: param.in,
    },
    summary: param.description || ''
  }
}

function transformEndpoint(spec: Object, endpoint: Object, path, method): Command {
  const provider = spec.info['x-providerName'].replace(/[-.]/g, '_');

  return {
    name: `${provider}_${transformPath(path)}_${method}`,
    summary: endpoint.summary || '',
    description: path + '\n\n' + (endpoint.description || ''),
    schema: {
      params: (endpoint.parameters || []).map(transformParam),
      http: {
        path,
        method,
      },
    },
    examples: []
  };
}

export function extract() {
  let specs;

  // specs = _(getSpecs(path.join(__dirname, '../../../openapi-directory/APIs/')))
  //   .map((spec, key) => ({ key, spec }))
  //   .value();
  // fs.writeFileSync('./tmp/specs.json', JSON.stringify(specs, null, 2));
  specs = require('../../tmp/specs.json');

  specs = _.map(specs).filter(x => x.spec.info.title.match(/trello/i));
  fs.writeFileSync('./tmp/specs-trello.json', JSON.stringify(specs, null, 2));
  specs = require('../../tmp/specs-trello.json');


  return _(specs)
    // do not handle multiple spec providers for now
    .filter(({ spec }) => !(spec.info['x-providerName'] in multipleSpecsProviders))
    .map(({ spec, key }) => {

      const endpoints = _(spec.paths)
        .map((val, path) => {
          return _.map(val, (endpoint, method) => transformEndpoint(spec, endpoint, path, method))
        })
        .flatten()
        .value();

      return endpoints;
    })
    .flatten();
}

// const x = extract();
// console.log(JSON.stringify(x, null, 2));
// console.log(absPath)
