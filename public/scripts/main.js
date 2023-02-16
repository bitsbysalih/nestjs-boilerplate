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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function forgotPassword() {
  const email = document.getElementById('email').value;
  await fetch(`/api/v1/auth/forgot-password?email=${email}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then(function (res) {
      console.log(res.json());
      console.log(email);
      if (res.ok) {
        alert('Check your email for the reset link');
      } else {
        alert('Something went wrong');
      }
    })
    .catch(function (err) {
      console.warn('Something went wrong.', err);
    });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function resetPassword(token) {
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  if (!password) {
    alert('Please enter a password');
    return;
  }

  if (password !== confirmPassword) {
    alert('Passwords do not match');
    return;
  }

  fetch(`/api/v1/auth/reset-password?token=${token}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ password }),
  })
    .then(function (res) {
      if (res.ok) {
        alert('Password reset successfully');
        window.location.href = 'https://app.sailspad.com/login';
      } else {
        alert('Something went wrong');
      }
      //redirect them to the login page
    })
    .catch(function (err) {
      console.warn('Something went wrong.', err);
    });
}
