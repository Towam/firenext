import Head from 'next/head'
import styles from '../styles/Home.module.css'
import Link from 'next/link'

import Loader  from '../components/Loader';
import { useState } from 'react';
import { firestore, postToJSON, fromMillis } from '../lib/firebase';
import PostFeed from '../components/PostFeed';

const LIMIT = 1;

export async function getServerSideProps(context) {
  const postsQuery = firestore
    .collectionGroup('posts')
    .where('published', '==', true)
    .orderBy('createdAt', 'desc')
    .limit(LIMIT);

  const posts = (await postsQuery.get()).docs.map(postToJSON);

  return {
    props: { posts },
  }

}

const getMorePosts = async () => {
  
  setLoading(true);
  const last = posts[posts.length - 1];

  const cursor = typeof last.createdAt === 'number' ? fromMillis (last.createdAt) : last.createdAt;

  const query = firestore
    .collectionGroup('posts')
    .where('published', '==', true)
    .orderBy('createdAt', 'desc')
    .startAfter(cursor)
    .limit(LIMIT);

  const newPosts = (await query.get()).docs.map((doc) => doc.data());

  setPosts(posts.concat(newPosts));
  setLoading(false);

  if (newPosts.length < LIMIT) {
    setPostsEnd(true);
  }
}

export default function Home(props) {

  const [posts, setPosts] = useState(props.posts);
  const [loading, setLoading] = useState(false);
  const [postsEnd, setPostsEnd] = useState(false);

  return (
    <main>

      <PostFeed posts={posts} />

      <Loader show={loading} />

      {!loading && ! postsEnd && <button onClick={getMorePosts}>Load more</button> }

      {postsEnd && 'You have reached the end!'}
    
    </main>
  )
}