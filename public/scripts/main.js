// eslint-disable-next-line @typescript-eslint/no-unused-vars
function addClickCount(name, id) {
  fetch('/api/v1/card/link-clicks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: name, cardId: id }),
  })
    .then(function (response) {
      console.log(name, id);
      console.log(response);
    })
    .catch(function (err) {
      console.warn('Something went wrong.', err);
    });
}
