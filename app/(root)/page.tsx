import React from "react";

import Categories from "@/components/Categories";
import Promotions from "@/components/Promotion";
import News from "@/components/News";

const HomePage: React.FC = () => {
  return (
    <section className="flex flex-col place-items-center gap-5 justify-center pt-5">
      <Promotions />
      <Categories />
      <News />
    </section>
  );
};

export default HomePage;
