import { useCallback, useContext, useEffect, useState } from 'react';
import { UserContext } from '../lib/context';
import { auth, firestore, googleAuthProvider } from '../lib/firebase';

import debounce from 'lodash.debounce';

export default function EnterPage({ }) {

  const {user, username } = useContext(UserContext)
  
  return (
    <main>
        <h1>Sign Up</h1>

        {user ?
          
          !username ? <UsernameForm /> : <SignOutButton />
          :
          <SignInButton />
      }
    </main>
  )
}  

// Sign in with Google Button
function SignInButton() {
  
  const signInWithGoogle = async () => {
    try {
      await auth.signInWithPopup(googleAuthProvider);
    } catch (err) {
      console.log(err);
    }
  }

  return (
    <button className='btn-google' onClick={signInWithGoogle}>
      <img src={'/google.png'} />Sign in with Google
    </button>
  );
  
}

// Sign out button
function SignOutButton(){

  const signOut = () => {
    auth.signOut();
  };

  return (
    <button onClick={signOut}>
      Sign out
    </button>
  )
}


function UsernameForm() {

  const [formValue, a] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [loading, setLoading] = useState(false);

  const { user, username } = useContext(UserContext);

  useEffect(() => {
    checkUsername(formValue);
  }, [formValue]);

  const onChange = (e) => {
    const val = e.target.value.toLowerCase();
    const re = /^(?=[a-zA-Z0-9._]{3,15}$)(?!.*[_.]{2})[^_.].*[^_.]$/;
     
    if (val.length < 3){
      setFormValue(val);
      setLoading(false);
      setIsValid(false);
    }

    if (re.test(val)){
      setFormValue(val);
      setLoading(true);
      setIsValid(false);
    }

  }

  const checkUsername = useCallback(
    debounce(async (username) => {

      console.log(username);
      if(username.length >= 3) {
        const ref = firestore.doc(`usernames/${username}`);
        const { exists } = await ref.get();
        console.log('Firestore read executed!');
        setIsValid(!exists);
        setLoading(false);
      }
    }, 500),
  []);

  const onSubmit = async(e) => {
    e.preventDefault();

    const userDoc = firestore.doc(`users/${user.uid}`);
    const usernameDoc = firestore.doc(`usernames/${formValue}`);

    const batch = firestore.batch();
    batch.set(userDoc, { username: formValue, photoURL: user.photoURL, displayName: user.displayName})
    batch.set(usernameDoc, {uid: user.uid});

    await batch.commit();

  }

  return (
    !username && (
      <section>
        <h3>Choose Username</h3>
        <form onSubmit={onSubmit}>
          <input name="username" placeholder="username" value={formValue} onChange={onChange} />
          <UsernameMessage username={formValue} isValid={isValid} loading={loading} />
          <button type="submit" className="btn-green" disabled={!isValid}>
            Choose
          </button>

          <h3>Debug State</h3>
          <div>
            Username: {formValue}<br />
            Loading: {loading.toString()}<br />
            Username valid: {isValid.toString()}<br />
          </div>
        </form>
      </section>

    )
  );
}

function UsernameMessage({ username, isValid, loading }) {
  if (loading) {
    return <p>Checking...</p>;
  } else if (isValid) {
    return <p className="text-success">{username} is available!</p>;
  } else if (username && !isValid) {
    return <p className="text-danger">That username is taken!</p>;
  } else {
    return <p></p>;
  }
}