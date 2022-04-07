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

function App() {
  const [config, setConfig] = useState({
    base: 'westend',
  });
  const [spec, setSpec] = useState({});

  useEffect(() => {
    if (!!config.base) {
      fetch(`${window.location.protocol}//${window.location.host}/spec/${config.base}.json`)
        .then((response) => response.json())
        .then((spec) => {
          setSpec(spec);
        })
        .catch(console.error);
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
              <Form.Label>address</Form.Label>
              <Form.Control type="text" placeholder={`${window.location.protocol}//${window.location.host}/spec/${config.base}.json`} />
            </Form.Group>
          </Col>
          <Col>
            <Form.Group>
              <Form.Label>chainspec</Form.Label>
              <Tabs defaultActiveKey="json">
                {['json', 'yaml'].map((markup, mI) => (
                  <Tab key={mI} eventKey={markup} title={markup}>
                    <SyntaxHighlighter language={markup} style={docco}>
                      {(markup === 'json') ? JSON.stringify(spec, null, 2) : YAML.stringify(spec)}
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
