
import Layout from "@/components/Layout";
import { Suspense, lazy } from "react";

// Lazy load the Home component for better performance
const Home = lazy(() => import("./Home"));

const Index = () => {
  return (
    <Layout>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }>
        <Home />
      </Suspense>
    </Layout>
  );
};

export default Index;
