import React, { useEffect, useState } from 'react';
import { Alert } from '@mui/material';

import { getUniversityVppAverageDynamics } from '../../services/api';
import VppAverageDynamicsChart from './VppAverageDynamicsChart';

const UniversityVppAverageDynamics = () => {
  const [rows, setRows] = useState([]);
  const [isForbidden, setIsForbidden] = useState(false);

  useEffect(() => {
    let isMounted = true;

    getUniversityVppAverageDynamics({ limit: 30 })
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
  }, []);

  if (isForbidden) {
    return null;
  }

  return (
    <>
      {rows.length < 2 && rows.length > 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Для полноценного графика нужно минимум два успешных импорта. Сейчас отображается первый снимок.
        </Alert>
      )}

      <VppAverageDynamicsChart
        title="Движение среднего балла по ВПП"
        caption="Динамика по университету после каждого успешного импорта"
        rows={rows}
      />
    </>
  );
};

export default UniversityVppAverageDynamics;