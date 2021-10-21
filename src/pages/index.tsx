import { GetStaticProps } from 'next';
import { getPrismicClient } from '../services/prismic';
import Prismic from '@prismicio/client';
import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import Header from '../components/Header';
import Link from 'next/link';
import { FiCalendar, FiUser } from 'react-icons/fi';
import { useState } from 'react';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Head from 'next/head';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
  preview;
}

export default function Home({ postsPagination, preview }: HomeProps): JSX.Element {
  const formatPost = (posts) => posts.results.map(post => ({
    ...post,
    first_publication_date: format(
      new Date(post.first_publication_date),
      "dd MMM yyyy",
      { locale: ptBR }
    )
  }))
  const [posts, setPosts] = useState<Post[]>(formatPost(postsPagination));
  const [nextPage, setNextPage] = useState(postsPagination.next_page);

  const handleClick = async () => {
    const result = await fetch(nextPage).then(response => response.json());
    const newPosts = await formatPost(result);
    const oldPosts = [...posts];
    await setPosts([
      ...oldPosts,
      ...newPosts
    ])
    await setNextPage(result.next_page)
  }

  return (
    <>
      <Head>
        <title>Home</title>
      </Head>
      <main className={commonStyles.container}>
        <Header />
        <div className={styles.posts}>
          {posts.map(post => (
            <Link href={`/post/${post.uid}`} key={post.uid}>
              <a className={styles.post}>
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle}</p>
                <ul>
                  <li>
                    <FiCalendar />
                    {post.first_publication_date}
                  </li>
                  <li>
                    <FiUser />
                    {post.data.author}
                  </li>
                </ul>

              </a>
            </Link>
          ))}
          {nextPage && <button type='button' onClick={handleClick}>
            Carregar mais posts
          </button>}
          {preview && (
            <aside>
              <Link href="/api/exit-preview" >
                <a className={commonStyles.exitPreview} >Sair do modo Preview</a>
              </Link>
            </aside>
          )}
        </div>
      </main>
    </>
  )
}

export const getStaticProps: GetStaticProps = async ({
  preview = false,
  previewData,
}) => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query([
    Prismic.predicates.at('document.type', 'posts')
  ], {
    fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
    ref: previewData?.ref ?? null,
    pageSize: 1,
  });

  return {
    props: {
      postsPagination: postsResponse,
      preview
    }
  }
};
