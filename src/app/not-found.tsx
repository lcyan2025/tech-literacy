const NotFound: React.FC = () => {
  return (
    <div className="flex items-center justify-center gap-4 h-screen text-center bg-white">
      <h1 className="text-2xl font-medium">404</h1>
      <div className="h-4 w-px bg-black"></div>
      <h2 className="text-sm font-normal">This page could not be found.</h2>
    </div>
  );
};

export default NotFound;
