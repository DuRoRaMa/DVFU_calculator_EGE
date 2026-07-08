import React from 'react';
import {
  Box,
  Chip,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';

import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

const formatScore = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '—';
  }

  return Number(value).toFixed(2);
};

const formatDate = (value) => {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatShortDate = (value) => {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
  });
};

const getChartValues = (rows) => {
  return rows
    .flatMap((row) => [
      Number(row.average_score_by_plan),
      Number(row.average_score_by_vpp_count),
    ])
    .filter((value) => !Number.isNaN(value));
};

const buildYAxisTicks = (minValue, maxValue, tickCount = 5) => {
  if (minValue === null || maxValue === null) {
    return [];
  }

  if (minValue === maxValue) {
    return [minValue];
  }

  const step = (maxValue - minValue) / (tickCount - 1);

  return Array.from({ length: tickCount }, (_, index) => {
    return minValue + step * index;
  });
};

const getX = (index, rowsCount, width, paddingLeft, paddingRight) => {
  if (rowsCount <= 1) {
    return paddingLeft + (width - paddingLeft - paddingRight) / 2;
  }

  return (
    paddingLeft +
    (index / (rowsCount - 1)) * (width - paddingLeft - paddingRight)
  );
};

const getY = (value, minValue, maxValue, height, paddingTop, paddingBottom) => {
  if (Number.isNaN(Number(value))) {
    return null;
  }

  const chartHeight = height - paddingTop - paddingBottom;

  if (minValue === maxValue) {
    return paddingTop + chartHeight / 2;
  }

  return paddingTop + ((maxValue - value) / (maxValue - minValue)) * chartHeight;
};

const buildPolylinePoints = ({
  rows,
  key,
  width,
  height,
  paddingTop,
  paddingRight,
  paddingBottom,
  paddingLeft,
  minValue,
  maxValue,
}) => {
  return rows
    .map((row, index) => {
      const value = Number(row[key]);

      if (Number.isNaN(value)) {
        return null;
      }

      const x = getX(index, rows.length, width, paddingLeft, paddingRight);
      const y = getY(value, minValue, maxValue, height, paddingTop, paddingBottom);

      if (y === null) {
        return null;
      }

      return `${x},${y}`;
    })
    .filter(Boolean)
    .join(' ');
};

const buildPointItems = ({
  rows,
  key,
  width,
  height,
  paddingTop,
  paddingRight,
  paddingBottom,
  paddingLeft,
  minValue,
  maxValue,
}) => {
  return rows
    .map((row, index) => {
      const value = Number(row[key]);

      if (Number.isNaN(value)) {
        return null;
      }

      const x = getX(index, rows.length, width, paddingLeft, paddingRight);
      const y = getY(value, minValue, maxValue, height, paddingTop, paddingBottom);

      if (y === null) {
        return null;
      }

      return {
        id: `${row.id || row.imported_at}-${key}`,
        x,
        y,
        value,
        row,
      };
    })
    .filter(Boolean);
};

const getXAxisTickIndexes = (rowsCount) => {
  if (rowsCount <= 1) {
    return [0];
  }

  if (rowsCount <= 6) {
    return Array.from({ length: rowsCount }, (_, index) => index);
  }

  const lastIndex = rowsCount - 1;
  const middleIndex = Math.round(lastIndex / 2);

  return [0, middleIndex, lastIndex];
};

const VppAverageDynamicsChart = ({
  title,
  caption,
  rows,
}) => {
  const safeRows = Array.isArray(rows) ? rows : [];
  const latest = safeRows[safeRows.length - 1];

  const width = 820;
  const height = 320;
  const paddingTop = 30;
  const paddingRight = 30;
  const paddingBottom = 76;
  const paddingLeft = 70;

  const values = getChartValues(safeRows);

  const rawMin = values.length > 0 ? Math.min(...values) : null;
  const rawMax = values.length > 0 ? Math.max(...values) : null;

  const minValue = rawMin === null
    ? null
    : Math.max(0, Math.floor(rawMin / 5) * 5);

  const maxValue = rawMax === null
    ? null
    : Math.min(100, Math.ceil(rawMax / 5) * 5 || 100);

  const yAxisTicks = buildYAxisTicks(minValue, maxValue, 5);

  const planPoints = minValue === null
    ? ''
    : buildPolylinePoints({
        rows: safeRows,
        key: 'average_score_by_plan',
        width,
        height,
        paddingTop,
        paddingRight,
        paddingBottom,
        paddingLeft,
        minValue,
        maxValue,
      });

  const vppPoints = minValue === null
    ? ''
    : buildPolylinePoints({
        rows: safeRows,
        key: 'average_score_by_vpp_count',
        width,
        height,
        paddingTop,
        paddingRight,
        paddingBottom,
        paddingLeft,
        minValue,
        maxValue,
      });

  const planPointItems = minValue === null
    ? []
    : buildPointItems({
        rows: safeRows,
        key: 'average_score_by_plan',
        width,
        height,
        paddingTop,
        paddingRight,
        paddingBottom,
        paddingLeft,
        minValue,
        maxValue,
      });

  const vppPointItems = minValue === null
    ? []
    : buildPointItems({
        rows: safeRows,
        key: 'average_score_by_vpp_count',
        width,
        height,
        paddingTop,
        paddingRight,
        paddingBottom,
        paddingLeft,
        minValue,
        maxValue,
      });

  const xAxisTickIndexes = getXAxisTickIndexes(safeRows.length);
  const xAxisY = height - paddingBottom;
  const yAxisX = paddingLeft;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        border: '1px solid #e5e7eb',
        overflowX: 'auto',
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={1.5}
        sx={{ mb: 2 }}
      >
        <Box>
          <Stack direction="row" spacing={0.75} alignItems="center">
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              {title}
            </Typography>

            <Tooltip
              title="По оси X отображается дата импорта. По оси Y отображается средний балл. По ВПП — сумма средних баллов ВПП в пределах плана, делённая на количество ВПП. По плану — та же сумма, делённая на план набора."
              arrow
            >
              <InfoOutlinedIcon
                sx={{
                  fontSize: 18,
                  color: 'text.secondary',
                  cursor: 'help',
                }}
              />
            </Tooltip>
          </Stack>

          {caption && (
            <Typography variant="body2" color="text.secondary">
              {caption}
            </Typography>
          )}
        </Box>

        {latest && (
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              label={`По ВПП: ${formatScore(latest.average_score_by_vpp_count)}`}
              color="success"
              size="small"
            />

            <Chip
              label={`По плану: ${formatScore(latest.average_score_by_plan)}`}
              color="warning"
              size="small"
            />

            <Chip
              label={`ВПП: ${latest.plan_applications_count}/${latest.admission_plan}`}
              size="small"
            />
          </Stack>
        )}
      </Stack>

      {safeRows.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Пока нет истории. Она появится после следующих успешных импортов.
        </Typography>
      ) : (
        <>
          <Box
            sx={{
              width,
              maxWidth: '100%',
              minWidth: 620,
              borderRadius: 2,
              backgroundColor: '#f8fafc',
              border: '1px solid #e5e7eb',
              p: 1,
            }}
          >
            <svg
              viewBox={`0 0 ${width} ${height}`}
              width="100%"
              height={height}
              role="img"
              aria-label="Движение среднего балла по ВПП"
            >
              <rect
                x={0}
                y={0}
                width={width}
                height={height}
                fill="#f8fafc"
              />

              {yAxisTicks.map((tick) => {
                const y = getY(
                  tick,
                  minValue,
                  maxValue,
                  height,
                  paddingTop,
                  paddingBottom
                );

                return (
                  <g key={`y-tick-${tick}`}>
                    <line
                      x1={paddingLeft}
                      y1={y}
                      x2={width - paddingRight}
                      y2={y}
                      stroke="#e2e8f0"
                      strokeWidth="1"
                    />

                    <text
                      x={paddingLeft - 12}
                      y={y + 4}
                      textAnchor="end"
                      fontSize="12"
                      fill="#64748b"
                    >
                      {formatScore(tick)}
                    </text>
                  </g>
                );
              })}

              <line
                x1={paddingLeft}
                y1={xAxisY}
                x2={width - paddingRight}
                y2={xAxisY}
                stroke="#94a3b8"
                strokeWidth="1.4"
              />

              <line
                x1={yAxisX}
                y1={paddingTop}
                x2={yAxisX}
                y2={xAxisY}
                stroke="#94a3b8"
                strokeWidth="1.4"
              />

              <text
                x={paddingLeft - 46}
                y={paddingTop - 10}
                fontSize="12"
                fill="#475569"
                fontWeight="700"
              >
                Средний балл
              </text>

              <text
                x={(paddingLeft + width - paddingRight) / 2}
                y={height - 12}
                textAnchor="middle"
                fontSize="12"
                fill="#475569"
                fontWeight="700"
              >
                Дата импорта
              </text>

              {xAxisTickIndexes.map((index) => {
                const row = safeRows[index];
                const x = getX(index, safeRows.length, width, paddingLeft, paddingRight);

                return (
                  <g key={`x-tick-${row.id || row.imported_at}`}>
                    <line
                      x1={x}
                      y1={xAxisY}
                      x2={x}
                      y2={xAxisY + 6}
                      stroke="#94a3b8"
                      strokeWidth="1"
                    />

                    <text
                      x={x}
                      y={xAxisY + 22}
                      textAnchor="middle"
                      fontSize="11"
                      fill="#64748b"
                    >
                      {formatShortDate(row.imported_at)}
                    </text>
                  </g>
                );
              })}

              {planPoints && (
                <polyline
                  points={planPoints}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {vppPoints && (
                <polyline
                  points={vppPoints}
                  fill="none"
                  stroke="#16a34a"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {planPointItems.map((point) => (
                <g key={point.id}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="4"
                    fill="#f59e0b"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />

                  <title>
                    {`Дата импорта: ${formatDate(point.row.imported_at)}\nСредний по плану: ${formatScore(point.value)}`}
                  </title>
                </g>
              ))}

              {vppPointItems.map((point) => (
                <g key={point.id}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="4"
                    fill="#16a34a"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />

                  <title>
                    {`Дата импорта: ${formatDate(point.row.imported_at)}\nСредний по ВПП: ${formatScore(point.value)}`}
                  </title>
                </g>
              ))}
            </svg>
          </Box>

          <Stack direction="row" spacing={2} sx={{ mt: 1.5 }}>
            <Stack direction="row" spacing={0.75} alignItems="center">
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: '#16a34a',
                }}
              />

              <Typography variant="caption" color="text.secondary">
                Средний по ВПП
              </Typography>
            </Stack>

            <Stack direction="row" spacing={0.75} alignItems="center">
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: '#f59e0b',
                }}
              />

              <Typography variant="caption" color="text.secondary">
                Средний по плану
              </Typography>
            </Stack>
          </Stack>

          <Box sx={{ mt: 2, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th align="left">Дата импорта</th>
                  <th align="right">Средний по ВПП</th>
                  <th align="right">Средний по плану</th>
                  <th align="right">ВПП в плане</th>
                  <th align="right">Не хватает</th>
                </tr>
              </thead>

              <tbody>
                {safeRows.slice(-8).map((row) => (
                  <tr key={row.id}>
                    <td>{formatDate(row.imported_at)}</td>
                    <td align="right">{formatScore(row.average_score_by_vpp_count)}</td>
                    <td align="right">{formatScore(row.average_score_by_plan)}</td>
                    <td align="right">
                      {row.plan_applications_count}/{row.admission_plan}
                    </td>
                    <td align="right">{row.plan_missing_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        </>
      )}
    </Paper>
  );
};

export default VppAverageDynamicsChart;
