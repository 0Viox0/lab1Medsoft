import { useEffect, type FC } from "react";
import { useNavigate } from "react-router";

export type RedirectProps = {
  to: string;
};

export const Redirect: FC<RedirectProps> = ({ to }) => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate(to);
  }, [navigate, to]);

  return <></>;
};
