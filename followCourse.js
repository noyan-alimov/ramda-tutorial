const R = require('ramda');
const cities = require('./cities.json');
const percentile = require('./percentile');

const KtoC = (k) => k - 273.15;
const KtoF = (k) => (k * 9) / 5 - 459.67;

const updateTemperature = R.curry((convertFn, city) => {
	const temp = Math.round(convertFn(city.temp));
	return R.mergeRight(city, { temp });
});

const updatedCities = R.map(updateTemperature(KtoF), cities);
// console.log(updatedCities);

const totalCostReducer = (acc, city) => {
	const { cost = 0 } = city;
	return acc + cost;
};

const totalCost = R.reduce(totalCostReducer, 0, updatedCities);
const cityCount = R.length(updatedCities);
// console.log(totalCost / cityCount);

const groupByPropReducer = (acc, city) => {
	const { cost = [], internetSpeed = [] } = acc;
	return R.mergeRight(acc, {
		cost: R.append(city.cost, cost),
		internetSpeed: R.append(city.internetSpeed, internetSpeed),
	});
};

const groupByProp = R.reduce(groupByPropReducer, {}, updatedCities);
// console.log(groupByProp);

const calcScore = (city) => {
	const { cost = 0, internetSpeed = 0 } = city;
	const costPercentile = percentile(groupByProp.cost, cost);
	const internetSpeedPercentile = percentile(
		groupByProp.internetSpeed,
		internetSpeed
	);
	const score = 100 * (1.0 - costPercentile) + 20 * internetSpeedPercentile;
	return R.mergeRight(city, { score });
};

const scoredCities = R.map(calcScore, updatedCities);
// console.log(scoredCities);

const filterByWeather = (city) => {
	const { temp = 0, humidity = 0 } = city;
	return temp > 68 && temp < 85 && humidity > 30 && humidity < 70;
};

const filteredCities = R.filter(filterByWeather, scoredCities);
// console.log(R.length(filteredCities));

const sortedCities = R.sortWith(
	[R.descend((city) => city.score)],
	filteredCities
);
// console.log(sortedCities);

const top10 = R.take(10, sortedCities);
// console.log(top10);
// console.log(R.length(top10));

const topCitiesPipeFunc = R.pipe(
	R.map(updateTemperature(KtoF)),
	R.map(calcScore),
	R.filter(filterByWeather),
	R.sortWith([R.descend((city) => city.score)]),
	R.take(10)
);
const topCities = topCitiesPipeFunc(cities);
console.log(topCities);
console.log(R.length(topCities));
