import type { NextPageContext } from 'next';

function ErrorPage({ statusCode }: { statusCode?: number }) {
  return (
    <div style={{ textAlign: 'center', paddingTop: '80px' }}>
      <h1>{statusCode ?? 'Erro'}</h1>
      <p>Algo deu errado.</p>
    </div>
  );
}

ErrorPage.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res?.statusCode ?? err?.statusCode ?? 404;
  return { statusCode };
};

export default ErrorPage;
