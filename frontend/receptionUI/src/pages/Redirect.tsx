import { useEffect } from "react";
import { useNavigate } from "react-router";

export const Redirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/add");
  }, [navigate]);

  return <></>;
};
