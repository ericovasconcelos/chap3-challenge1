import { GetStaticPaths, GetStaticProps } from 'next';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import Header from '../../components/Header';
import Head from 'next/head';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { RichText } from 'prismic-dom';

import Prismic from '@prismicio/client';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import Link from 'next/link';
import { UtterancesComments } from '../../components/Header/UtteranceComments';

interface Post {
  last_publication_date: string | null;
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  preview: any;
  post: Post;
  previousPost: {
    data: {
      title: string;
    }
    uid: string;
  } | null;
  nextPost: {
    data: {
      title: string;
    }
    uid: string;
  } | null;
}

export default function Post({ post, previousPost, nextPost, preview }: PostProps) {

  const router = useRouter();

  if (router.isFallback) {
    return <h1>Carregando...</h1>;
  }

  const totalWords = post.data?.content.reduce((p, c) => {
    const headingTotal = c.heading.split(' ').length;
    const wordsTotal = c.body.map(item => item.text.split(' ').length).reduce((p, c) => p + c, 0);
    return p + headingTotal + wordsTotal;
  }, 0);
  const readTime = Math.ceil(totalWords / 200);

  useEffect(() => {
    // let script = document.createElement("script");
    // let anchor = document.getElementById("inject-comments-for-uterances");
    // script.setAttribute("src", "https://utteranc.es/client.js");
    // script.setAttribute("crossorigin", "anonymous");
    // script.setAttribute("async", "true");
    // script.setAttribute("repo", "ericovasconcelos/chap3-challenge1");
    // script.setAttribute("issue-term", "pathname");
    // script.setAttribute("theme", "github-dark");
    // anchor.appendChild(script);
  }, []);

  return (
    <>
      <Head>
        <title>{`${post.data?.title} | SpaceTravel `}</title>
      </Head>
      <Header />
      <img src={post.data?.banner.url} className={styles.banner} />
      <main className={commonStyles.container}>
        <article className={styles.article}>
          <span className={styles.title}>{post.data?.title}</span>
          <ul>
            <li><FiCalendar />{format(new Date(post.first_publication_date), 'dd MMM yyyy', { locale: ptBR })}</li>
            <li><FiUser />{post.data?.author}</li>
            <li><FiClock />{`${readTime} min`}</li>
          </ul>
          <span className={styles.lastEdited}>
            {post.last_publication_date ? format(new Date(post.last_publication_date), "'* editado em' dd MMM yyyy', às 'H:m", { locale: ptBR }) : ''}
          </span>
          <span className={styles.content}>
            {post.data?.content.map(content => {
              return (
                <article key={content.heading}>
                  <h2>{content.heading}</h2>
                  <div
                    className={styles.postContent}
                    dangerouslySetInnerHTML={{
                      __html: RichText.asHtml(content.body),
                    }}
                  />
                </article>
              )
            })}
          </span>
          <hr />
          {(nextPost || previousPost) && <div className={styles.footer}>
            <div className={styles.previousPost}>
              {previousPost && <>
                <p>{previousPost.data.title}</p>
                <Link href={`/post/${previousPost.uid}`}>
                  <a>Post anterior modo
                  </a>
                </Link>
              </>}
            </div>
            <div className={styles.nextPostStyle}>
              {nextPost && <>
                <p>{nextPost.data.title}</p>
                <Link href={`/post/${nextPost.uid}`}>
                  <a>Próximo post
                  </a>
                </Link>
              </>}
            </div>
          </div>}
          <UtterancesComments />
          {preview && (
            <aside>
              <Link href="/api/exit-preview">
                <a className={commonStyles.exitPreview}>Sair do modo Preview</a>
              </Link>
            </aside>
          )}
        </article>
      </main>
    </>
  );
}

export const getStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.predicates.at('document.type', 'posts'),
  ]
  );

  const paths = posts.results.map(post => {
    return {
      params: {
        slug: post.uid
      }
    }
  })

  return ({
    paths,
    fallback: true
  })
};

export const getStaticProps = async ({
  preview = false,
  previewData,
  params
}) => {
  const slug = params.slug;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', `${slug}`, {
    ref: previewData?.ref ?? null,
  });

  const post = await {
    ...response,
    content: response?.data?.content.map(content => {
      return {
        heading: content.heading,
        body: [...content.body]
      };
    }) ?? null
  }

  const prevpost = (await prismic.query(Prismic.predicates.at('document.type', 'posts'), { pageSize: 1, after: `${post.id}`, orderings: '[document.first_publication_date desc]' })).results[0];
  const nextpost = (await prismic.query(Prismic.predicates.at('document.type', 'posts'), { pageSize: 1, after: `${post.id}`, orderings: '[document.first_publication_date]' })).results[0];

  return {
    props: {
      preview,
      post: post,
      nextPost: nextpost ?? null,
      previousPost: prevpost ?? null,
    }
  }
};

