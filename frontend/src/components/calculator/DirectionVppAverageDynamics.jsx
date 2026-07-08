import React, { useEffect, useState } from 'react';

import { getDirectionVppAverageDynamics } from '../../services/api';
import VppAverageDynamicsChart from '../Admin/VppAverageDynamicsChart';

const DirectionVppAverageDynamics = ({
  directionCode,
}) => {
  const [rows, setRows] = useState([]);
  const [isForbidden, setIsForbidden] = useState(false);

  useEffect(() => {
    if (!directionCode) {
      return undefined;
    }

    let isMounted = true;

    getDirectionVppAverageDynamics(directionCode, { limit: 30 })
      .then((response) => {
        if (!isMounted) {
          return;
        }

        setRows(response.data.results || []);
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }

        if (error?.response?.status === 401 || error?.response?.status === 403) {
          setIsForbidden(true);
          return;
        }

        console.error(error);
      });

    return () => {
      isMounted = false;
    };
  }, [directionCode]);

  if (isForbidden || !directionCode) {
    return null;
  }

  return (
    <VppAverageDynamicsChart
      title="Движение среднего балла по ВПП"
      caption="Динамика по выбранному направлению после каждого успешного импорта"
      rows={rows}
    />
  );
};

export default DirectionVppAverageDynamics;