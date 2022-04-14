import { useEffect, useState } from 'react';

import Container from 'react-bootstrap/Container';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Form from 'react-bootstrap/Form';
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';

import YAML from 'yaml';

import SyntaxHighlighter from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';

import {
  cryptoWaitReady,
  encodeAddress,
  decodeAddress,
  mnemonicGenerate,
  mnemonicToMiniSecret,
  //mnemonicValidate,
  ed25519PairFromSeed,
  sr25519PairFromSeed,
} from '@polkadot/util-crypto';
import { u8aToHex } from '@polkadot/util';

import AuthorityEditor from './AuthorityEditor';

const baseSpecs = [
  {
    name: 'polkadot',
  },
  {
    name: 'kusama',
  },
  {
    name: 'rococo',
  },
  {
    name: 'westend',
  },
];

function newAccount(scheme) {
  const mnemonic = mnemonicGenerate();
  const seed = mnemonicToMiniSecret(mnemonic);
  const pair = (scheme === 'ed25519')
    ? ed25519PairFromSeed(seed)
    : sr25519PairFromSeed(seed);
  const ss58 = encodeAddress(pair.publicKey, 42);
  return {
    mnemonic,
    public: {
      hex: u8aToHex(decodeAddress(ss58)),
      ss58,
    },
  };
}

function stringify(obj, depth) {
  if(obj == null){ return String(obj); }
  switch(typeof obj){
    case "string": return `"${obj}"`;
    case "function": return obj.name || obj.toString();
    case "object":
      var indent = Array(depth||1).join('  '), isArray = Array.isArray(obj);
      return '{['[+isArray] + Object.keys(obj).map(function(key){
           return '\n  ' + indent + key + ': ' + stringify(obj[key], (depth||1)+1);
         }).join(',') + '\n' + indent + '}]'[+isArray];
    default: return obj.toString();
  }
}

function App() {
  const [config, setConfig] = useState({
    base: 'kusama',
  });
  const [spec, setSpec] = useState({});
  const [secrets, setSecrets] = useState({});

  useEffect(() => {
    if (!!config.base) {
      cryptoWaitReady().then(() => {
        fetch(`${window.location.protocol}//${window.location.host}/spec/${config.base}.json`)
          .then((response) => response.json())
          .then((spec) => {
            const secrets = {
              sudo: {
                account: newAccount('sr25519'),
                balance: 1000000000000000000,
              },
              authorities: spec.genesis.runtime.staking.stakers.map((staker, sI) => ({
                controller: newAccount('sr25519'),
                stash: newAccount('sr25519'),
                grandpa: newAccount('ed25519'),
                babe: newAccount('sr25519'),
                im_online: newAccount('sr25519'),
                para_validator: newAccount('sr25519'),
                para_assignment: newAccount('sr25519'),
                authority_discovery: newAccount('sr25519'),
                balance: 100000000000000,
                stake: 100000000000000,
              })),
            };
            setSecrets(secrets);
            setSpec({
              ...spec,
              genesis: {
                ...spec.genesis,
                runtime: {
                  ...spec.genesis.runtime,
                  balances: {
                    ...spec.genesis.runtime.balances,
                    balances: [
                      [
                        secrets.sudo.account.public.ss58,
                        secrets.sudo.balance,
                      ],
                      ...secrets.authorities.map((authority) => [
                        authority.controller.public.ss58,
                        authority.balance,
                      ]),
                    ]
                  },
                  staking: {
                    ...spec.genesis.runtime.staking,
                    invulnerables: secrets.authorities.map((authority) => authority.controller.public.ss58),
                    stakers: secrets.authorities.map((authority) => [
                      authority.controller.public.ss58,
                      authority.stash.public.ss58,
                      authority.stake,
                      "Validator",
                    ]),
                  },
                  session: {
                    ...spec.genesis.runtime.session,
                    keys: secrets.authorities.map((authority) => [
                      authority.controller.public.ss58,
                      authority.controller.public.ss58,
                      {
                        grandpa: authority.grandpa.public.ss58,
                        babe: authority.babe.public.ss58,
                        im_online: authority.im_online.public.ss58,
                        para_validator: authority.para_validator.public.ss58,
                        para_assignment: authority.para_assignment.public.ss58,
                        authority_discovery: authority.authority_discovery.public.ss58,
                      }
                    ]),
                  }
                },
              },
            });
          })
          .catch(console.error);
      });
    }
    return () => {};
  }, [config.base]);
  return (
    <Container>
      <Form>
        <Row>
          <Col>
            <Form.Group>
              <Form.Label>
                base
              </Form.Label>
              <Form.Select
                defaultValue={config.base}
                onChange={
                  (e) => {
                    const base = e.target.value;
                    setConfig((c) => ({
                      ...c,
                      base
                    }))
                  }
                }>
                {
                  baseSpecs.map((baseSpec, bsI) => (
                    <option key={bsI} value={baseSpec.name}>
                      {baseSpec.name}
                    </option>
                  ))
                }
              </Form.Select>
            </Form.Group>
            <Form.Group>
              <Form.Label>secrets</Form.Label>
              <Tabs defaultActiveKey="json">
                {['js', 'json', 'yaml'].map((markup, mI) => (
                  <Tab key={mI} eventKey={markup} title={markup}>
                    <SyntaxHighlighter language={markup} style={docco}>
                      {(markup === 'json') ? JSON.stringify(secrets, null, 2) : (markup === 'yaml') ? YAML.stringify(secrets) : stringify(secrets)}
                    </SyntaxHighlighter>
                  </Tab>
                ))}
              </Tabs>
            </Form.Group>
          </Col>
          <Col>
            <Form.Group>
              <Form.Label>chainspec</Form.Label>
              <Tabs defaultActiveKey="json">
                {['js', 'json', 'yaml'].map((markup, mI) => (
                  <Tab key={mI} eventKey={markup} title={markup}>
                    <SyntaxHighlighter language={markup} style={docco}>
                      {(markup === 'json') ? JSON.stringify(spec, null, 2) : (markup === 'yaml') ? YAML.stringify(spec) : stringify(spec)}
                    </SyntaxHighlighter>
                  </Tab>
                ))}
              </Tabs>
            </Form.Group>
          </Col>
        </Row>
      </Form>
    </Container>
  );
}

export default App;
