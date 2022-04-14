
import Form from 'react-bootstrap/Form';

function AuthorityEditor(props) {
  return (
    Object.keys(props.authority).map((key, kI) => (
      <Form.Group key={kI}>
        <Form.Label>
          {key}
        </Form.Label>
        <Form.Control type="text" defaultValue={props.authority[key]} />
      </Form.Group>
    ))
  );
}

export default AuthorityEditor;