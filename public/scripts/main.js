// eslint-disable-next-line @typescript-eslint/no-unused-vars
function addClickCount(name, id) {
  fetch('/api/v1/card/link-clicks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: name, cardId: id }),
  })
    .then(function () {
      console.log(name, id);
    })
    .catch(function (err) {
      console.warn('Something went wrong.', err);
    });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function addProfileVisitsCount(id) {
  fetch('/api/v1/card/profile-visits', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ cardId: id }),
  })
    .then(function () {
      console.log(id);
    })
    .catch(function (err) {
      console.warn('Something went wrong.', err);
    });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function addedToContactsCount(id) {
  fetch('/api/v1/card/added-to-contacts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ cardId: id }),
  })
    .then(function () {
      console.log(id);
    })
    .catch(function (err) {
      console.warn('Something went wrong.', err);
    });
}
