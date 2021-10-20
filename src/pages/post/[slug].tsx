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


interface Post {
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
  post: Post;
}

export default function Post({ post }: PostProps) {

  const router = useRouter();

  if(router.isFallback) {
    return <h1>Carregando...</h1>;
  }

  const totalWords = post.data.content.reduce((p, c) => {
    const headingTotal = c.heading.split(' ').length;
    const wordsTotal = c.body.map(item => item.text.split(' ').length).reduce((p,c) => p+c, 0);
    return p+headingTotal+wordsTotal;
  }, 0);
  const readTime = Math.ceil(totalWords / 200);

  return (
    <>
    <Head>
      <title>{`${post.data.title} | SpaceTravel `}</title>
    </Head>
      <Header />
      <img src={post.data.banner.url} className={styles.banner} />
      <main className={commonStyles.container}>
        <article className={styles.article}>
          <span className={styles.title}>{post.data.title}</span>
          <ul>
            <li><FiCalendar />{ format(new Date(post.first_publication_date), 'dd MMM yyyy', { locale: ptBR })}</li>
            <li><FiUser />{post.data.author}</li>
            <li><FiClock />{`${readTime} min`}</li>
          </ul>
          <span className={styles.content}>
            {post.data.content.map(content => {
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

export const getStaticProps = async context => {
  const slug = context.params.slug;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', `${slug}`, {});

  const post = {
    ...response,
    content: response.data.content.map(content => {
      return {
        heading: content.heading,
        body: [...content.body]
      };
    })
  }

  return {
    props: {
      post: post
    }
  }
};
