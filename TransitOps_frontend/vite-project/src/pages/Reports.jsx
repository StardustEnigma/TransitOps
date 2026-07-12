import React, { useState } from 'react';
import { 
  Calendar, 
  Layers, 
  Download, 
  MoreVertical, 
  Truck, 
  Bus, 
  Car, 
  TrendingDown, 
  TrendingUp,
  Info
} from 'lucide-react';
import './Reports.css';

export default function Reports() {
  const [timeRange, setTimeRange] = useState('Last 30 Days');
  const [segment, setSegment] = useState('All Segments');
  const [showRangeMenu, setShowRangeMenu] = useState(false);
  const [showSegmentMenu, setShowSegmentMenu] = useState(false);
  const [hoveredData, setHoveredData] = useState(null);

  const [roiVehicles, setRoiVehicles] = useState([
    {
      id: 'TRK-9021',
      type: 'Truck',
      q1: 'Good',
      q2: 'Good',
      q3: 'Avg',
      q4: 'Low',
      trend: 'down'
    },
    {
      id: 'TRK-4432',
      type: 'Truck',
      q1: 'Avg',
      q2: 'Avg+',
      q3: 'Good',
      q4: 'Good',
      trend: 'up'
    },
    {
      id: 'BUS-1104',
      type: 'Bus',
      q1: 'Good',
      q2: 'Good',
      q3: 'Good',
      q4: 'High',
      trend: 'up'
    },
    {
      id: 'VAN-308',
      type: 'Van',
      q1: 'Avg',
      q2: 'Avg+',
      q3: 'Good',
      q4: 'Avg+',
      trend: 'up'
    }
  ]);

  const handleDownloadCSV = () => {
    const headers = 'Vehicle ID,Q1,Q2,Q3,Q4,Trend\n';
    const rows = roiVehicles.map(v => `${v.id},${v.q1},${v.q2},${v.q3},${v.q4},${v.trend}`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `TransitOps_Performance_${timeRange.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getRoiBadge = (grade) => {
    switch (grade) {
      case 'High':
        return <span className="roi-pill roi-high">High</span>;
      case 'Good':
        return <span className="roi-pill roi-good">Good</span>;
      case 'Avg+':
        return <span className="roi-pill roi-avgplus">Avg+</span>;
      case 'Avg':
        return <span className="roi-pill roi-avg">Avg</span>;
      case 'Low':
        return <span className="roi-pill roi-low">Low</span>;
      default:
        return <span className="roi-pill">{grade}</span>;
    }
  };

  const getVehicleIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'bus':
        return <Bus size={18} />;
      case 'van':
        return <Car size={18} />;
      default:
        return <Truck size={18} />;
    }
  };

  return (
    <div className="reports-page">
        {/* Top Title Banner */}
        <div className="reports-top-title">
          <span>Reports & Analytics</span>
        </div>

        {/* Fleet Performance Header & Action Buttons */}
        <div className="performance-header-bar">
          <div className="performance-title-group">
            <h1 className="performance-title">Fleet Performance</h1>
            <p className="performance-subtitle">Comprehensive overview of operational metrics.</p>
          </div>

          <div className="performance-controls">
            {/* Time Range Filter */}
            <div className="control-dropdown-wrapper">
              <button 
                className="btn-control-filter"
                onClick={() => {
                  setShowRangeMenu(!showRangeMenu);
                  setShowSegmentMenu(false);
                }}
              >
                <Calendar size={16} className="control-icon" />
                <span>{timeRange}</span>
              </button>
              {showRangeMenu && (
                <div className="control-menu">
                  {['Last 7 Days', 'Last 30 Days', 'Last 90 Days', 'Year to Date'].map(range => (
                    <button
                      key={range}
                      className={`control-menu-item ${timeRange === range ? 'active' : ''}`}
                      onClick={() => {
                        setTimeRange(range);
                        setShowRangeMenu(false);
                      }}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Segments Filter */}
            <div className="control-dropdown-wrapper">
              <button 
                className="btn-control-filter"
                onClick={() => {
                  setShowSegmentMenu(!showSegmentMenu);
                  setShowRangeMenu(false);
                }}
              >
                <Layers size={16} className="control-icon" />
                <span>{segment}</span>
              </button>
              {showSegmentMenu && (
                <div className="control-menu">
                  {['All Segments', 'Heavy Fleet (Trucks)', 'Light Fleet (Vans/Buses)'].map(seg => (
                    <button
                      key={seg}
                      className={`control-menu-item ${segment === seg ? 'active' : ''}`}
                      onClick={() => {
                        setSegment(seg);
                        setShowSegmentMenu(false);
                      }}
                    >
                      {seg}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Download CSV Button */}
            <button className="btn-download-csv" onClick={handleDownloadCSV}>
              <Download size={16} strokeWidth={2.5} />
              <span>Download CSV</span>
            </button>
          </div>
        </div>

        {/* Middle Charts Grid (2 Columns: ~65% / ~35%) */}
        <div className="charts-grid-row">
          {/* Fuel Efficiency Trends Line Chart Card */}
          <div className="chart-card efficiency-card">
            <div className="chart-card-header">
              <div>
                <h2 className="chart-card-title">Fuel Efficiency Trends</h2>
                <p className="chart-card-subtitle">Distance vs Fuel Consumption per Vehicle</p>
              </div>
              <button className="btn-more-options" title="Chart Options">
                <MoreVertical size={18} />
              </button>
            </div>

            <div className="line-chart-container">
              {hoveredData && (
                <div 
                  className="chart-tooltip"
                  style={{ left: `${hoveredData.x}px`, top: `${hoveredData.y - 45}px` }}
                >
                  <strong>{hoveredData.month}:</strong> {hoveredData.value} MPG ({hoveredData.series})
                </div>
              )}

              <svg className="efficiency-svg" viewBox="0 0 650 300" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="lightFleetGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#000000" stopOpacity="0.08" />
                    <stop offset="100%" stopColor="#000000" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Y-Axis Horizontal Grid Lines & Labels */}
                {[20, 18, 16, 14, 12, 10, 8, 6].map((val, idx) => {
                  const y = 30 + idx * 32;
                  return (
                    <g key={val}>
                      <text x="25" y={y + 4} className="chart-axis-label text-right">{val}</text>
                      <line x1="45" y1={y} x2="620" y2={y} className="chart-grid-line" />
                    </g>
                  );
                })}

                {/* X-Axis Labels */}
                {[
                  { month: 'Jan', x: 65 },
                  { month: 'Feb', x: 170 },
                  { month: 'Mar', x: 275 },
                  { month: 'Apr', x: 380 },
                  { month: 'May', x: 485 },
                  { month: 'Jun', x: 590 }
                ].map((item) => (
                  <text key={item.month} x={item.x} y="280" className="chart-axis-label text-center">
                    {item.month}
                  </text>
                ))}

                {/* Light Fleet Area Fill */}
                <path 
                  d="M65,246.8 L170,242.0 L275,248.4 L380,237.2 L485,230.8 L590,235.6 L590,254 L65,254 Z" 
                  fill="url(#lightFleetGrad)" 
                />

                {/* Heavy Fleet Dashed Line */}
                <path 
                  d="M65,60.4 C117.5,67 117.5,70 170,70 C222.5,70 222.5,58.8 275,58.8 C327.5,58.8 327.5,46 380,46 C432.5,46 432.5,54 485,54 C537.5,54 537.5,42.8 590,42.8" 
                  fill="none" 
                  stroke="#475569" 
                  strokeWidth="2" 
                  strokeDasharray="5 5"
                />

                {/* Light Fleet Solid Black Line */}
                <path 
                  d="M65,246.8 C117.5,244 117.5,242.0 170,242.0 C222.5,242.0 222.5,248.4 275,248.4 C327.5,248.4 327.5,237.2 380,237.2 C432.5,237.2 432.5,230.8 485,230.8 C537.5,230.8 537.5,235.6 590,235.6" 
                  fill="none" 
                  stroke="#000000" 
                  strokeWidth="2.5"
                />

                {/* Data Points (Circles) - Heavy Fleet */}
                {[
                  { month: 'Jan', val: 18.1, x: 65, y: 60.4 },
                  { month: 'Feb', val: 17.5, x: 170, y: 70 },
                  { month: 'Mar', val: 18.2, x: 275, y: 58.8 },
                  { month: 'Apr', val: 19.0, x: 380, y: 46 },
                  { month: 'May', val: 18.5, x: 485, y: 54 },
                  { month: 'Jun', val: 19.2, x: 590, y: 42.8 }
                ].map((pt, idx) => (
                  <circle 
                    key={`heavy-${idx}`} 
                    cx={pt.x} 
                    cy={pt.y} 
                    r="4.5" 
                    className="chart-data-point heavy-pt"
                    onMouseEnter={() => setHoveredData({ month: pt.month, value: pt.val, series: 'Heavy Fleet', x: pt.x, y: pt.y })}
                    onMouseLeave={() => setHoveredData(null)}
                  />
                ))}

                {/* Data Points (Circles) - Light Fleet */}
                {[
                  { month: 'Jan', val: 6.5, x: 65, y: 246.8 },
                  { month: 'Feb', val: 6.8, x: 170, y: 242.0 },
                  { month: 'Mar', val: 6.4, x: 275, y: 248.4 },
                  { month: 'Apr', val: 7.1, x: 380, y: 237.2 },
                  { month: 'May', val: 7.5, x: 485, y: 230.8 },
                  { month: 'Jun', val: 7.2, x: 590, y: 235.6 }
                ].map((pt, idx) => (
                  <circle 
                    key={`light-${idx}`} 
                    cx={pt.x} 
                    cy={pt.y} 
                    r="4.5" 
                    className="chart-data-point light-pt"
                    onMouseEnter={() => setHoveredData({ month: pt.month, value: pt.val, series: 'Light Fleet', x: pt.x, y: pt.y })}
                    onMouseLeave={() => setHoveredData(null)}
                  />
                ))}
              </svg>

              {/* Chart Legend */}
              <div className="chart-legend-row">
                <div className="legend-item">
                  <span className="legend-dot dot-heavy"></span>
                  <span className="legend-text">Heavy Fleet (MPG)</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot dot-light"></span>
                  <span className="legend-text">Light Fleet (MPG)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cost Breakdown Donut Chart Card */}
          <div className="chart-card donut-card">
            <div className="chart-card-header">
              <div>
                <h2 className="chart-card-title">Cost Breakdown</h2>
                <p className="chart-card-subtitle">YTD Expenditure</p>
              </div>
            </div>

            <div className="donut-content-wrapper">
              <div className="donut-chart-box">
                <svg className="donut-svg" viewBox="0 0 220 220">
                  <g transform="rotate(-90 110 110)">
                    {/* Fuel (45%) */}
                    <circle 
                      cx="110" 
                      cy="110" 
                      r="75" 
                      fill="transparent" 
                      stroke="#000000" 
                      strokeWidth="28" 
                      strokeDasharray="212.06 471.24"
                      strokeDashoffset="0"
                      className="donut-segment"
                    />
                    {/* Maintenance (35%) */}
                    <circle 
                      cx="110" 
                      cy="110" 
                      r="75" 
                      fill="transparent" 
                      stroke="#4A5568" 
                      strokeWidth="28" 
                      strokeDasharray="164.93 471.24"
                      strokeDashoffset="-212.06"
                      className="donut-segment"
                    />
                    {/* Others (20%) */}
                    <circle 
                      cx="110" 
                      cy="110" 
                      r="75" 
                      fill="transparent" 
                      stroke="#CBD5E1" 
                      strokeWidth="28" 
                      strokeDasharray="94.25 471.24"
                      strokeDashoffset="-376.99"
                      className="donut-segment"
                    />
                  </g>

                  {/* Center Text */}
                  <text x="110" y="103" textAnchor="middle" className="donut-label-text">Total</text>
                  <text x="110" y="128" textAnchor="middle" className="donut-total-text">$142K</text>
                </svg>
              </div>

              {/* Donut Legend List */}
              <div className="donut-legend-list">
                <div className="donut-legend-item">
                  <div className="donut-legend-label">
                    <span className="donut-dot dot-fuel"></span>
                    <span>Fuel</span>
                  </div>
                  <span className="donut-percentage">45%</span>
                </div>

                <div className="donut-legend-item">
                  <div className="donut-legend-label">
                    <span className="donut-dot dot-maintenance"></span>
                    <span>Maintenance</span>
                  </div>
                  <span className="donut-percentage">35%</span>
                </div>

                <div className="donut-legend-item">
                  <div className="donut-legend-label">
                    <span className="donut-dot dot-others"></span>
                    <span>Others</span>
                  </div>
                  <span className="donut-percentage">20%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Vehicle ROI Heatmap Card */}
        <div className="chart-card roi-card">
          <div className="chart-card-header roi-header">
            <div>
              <h2 className="chart-card-title">Vehicle ROI Heatmap</h2>
              <p className="chart-card-subtitle">Profitability vs Operating Costs by Unit</p>
            </div>

            <div className="roi-scale-legend">
              <span className="roi-scale-label">Low ROI</span>
              <div className="roi-scale-bar"></div>
              <span className="roi-scale-label">High ROI</span>
            </div>
          </div>

          <div className="table-responsive">
            <table className="roi-table">
              <thead>
                <tr>
                  <th>Vehicle ID</th>
                  <th className="text-center">Q1</th>
                  <th className="text-center">Q2</th>
                  <th className="text-center">Q3</th>
                  <th className="text-center">Q4</th>
                  <th className="text-right">Trend</th>
                </tr>
              </thead>
              <tbody>
                {roiVehicles.map((veh) => (
                  <tr key={veh.id} className="roi-row">
                    <td>
                      <div className="roi-vehicle-cell">
                        <div className="roi-vehicle-icon">
                          {getVehicleIcon(veh.type)}
                        </div>
                        <span className="roi-vehicle-id">{veh.id}</span>
                      </div>
                    </td>
                    <td className="text-center">{getRoiBadge(veh.q1)}</td>
                    <td className="text-center">{getRoiBadge(veh.q2)}</td>
                    <td className="text-center">{getRoiBadge(veh.q3)}</td>
                    <td className="text-center">{getRoiBadge(veh.q4)}</td>
                    <td className="text-right">
                      <span className="trend-icon-wrapper">
                        {veh.trend === 'down' ? (
                          <TrendingDown size={20} className="trend-down" strokeWidth={2.5} />
                        ) : (
                          <TrendingUp size={20} className="trend-up" strokeWidth={2.5} />
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
  );
}
