const API_KEY = "fc368e7ef84aaea798b23e131833cace";
const city = "dumaguete";
const DAYS_OF_THE_WEEK = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
let selectedCityText;
let selectedCity;

const getCitiesUsingGeolocation = async (searchText) => {
    const response = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${searchText}&limit=5&appid=${API_KEY}`);
    return response.json();
};
const getCurrentWeatherData = async ({ lat, lon, name: city }) => {
    const url = lat && lon ? `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric` :
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
    const response = await fetch(url);
    return response.json();
}

const getHourlyForecast = async ({ name: city }) => {             //name given an alias city
    const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`);
    const data = await response.json();
    return data.list.map(forecast => {
        const { main: { temp, temp_min, temp_max }, dt, dt_txt, weather: [{ description, icon }] } = forecast;
        return { temp, temp_min, temp_max, dt, dt_txt, description, icon };
    })
}

const formatTemperature = (temp) => `${temp?.toFixed(1)}°`
const createIconURL = (icon) => `http://openweathermap.org/img/wn/${icon}@2x.png`
const loadCurrentForecast = ({ name, main: { temp, temp_max, temp_min }, weather: [{ description }] }) => {
    const currentForecastElement = document.querySelector("#current-forecast");

    currentForecastElement.querySelector(".city").textContent = name;
    currentForecastElement.querySelector(".temp").textContent = formatTemperature(temp);
    currentForecastElement.querySelector(".description").textContent = description;
    currentForecastElement.querySelector(".min-max-temp").textContent = `H: ${formatTemperature(temp_max)} L: ${formatTemperature(temp_min)}`;

}

const loadHourlyForecast = ({ main: { temp: tempNow }, weather: [{ icon: iconNow, description: descriptionNow }] }, hourlyForecast) => {

    const timeFormatter = Intl.DateTimeFormat("en", {
        hour12: true,
        hour: "numeric"
    });
    let dataFor12Hours = hourlyForecast.slice(2, 14); //12 entries

    const hourlyContainer = document.querySelector(".hourly-container");
    let innerHTMLString = `<article>
    <p class="time" >Now</p>
   <img class="icon" title='${descriptionNow}' src="${createIconURL(iconNow)}"/>    
    <p class="hourly-temp">${formatTemperature(tempNow)}</p>
</article>`;

    for (let { temp, icon, dt_txt, description } of dataFor12Hours) {
        innerHTMLString += `<article>
                     <p class="time">${timeFormatter.format(new Date(dt_txt))}</p>
                    <img class="icon" title='${description}' src="${createIconURL(icon)}"/>    
                     <p class="hourly-temp">${formatTemperature(temp)}</p>
                </article>`;
        console.log(description);
    }
    hourlyContainer.innerHTML = innerHTMLString;

}

const calculateDayWiseForecast = (hourlyForecast) => {
    let dayWiseForecast = new Map();
    for (let forecast of hourlyForecast) {
        const [date] = forecast.dt_txt.split(" ");
        console.log("date: ", date);
        console.log("forecast: ", forecast);
        const dayOfTheWeek = DAYS_OF_THE_WEEK[new Date(date).getDay()];
        console.log("dayOfTheWeek: ", dayOfTheWeek);
        if (dayWiseForecast.has(dayOfTheWeek)) {
            let forecastForTheDay = dayWiseForecast.get(dayOfTheWeek);
            forecastForTheDay.push(forecast);
            dayWiseForecast.set(dayOfTheWeek, forecastForTheDay);
        } else {
            dayWiseForecast.set(dayOfTheWeek, [forecast]);
        }
        console.log("dayWiseForecast: ", dayWiseForecast);
    }
    console.log("dayWiseForecast: ", dayWiseForecast);
    for (let [key, value] of dayWiseForecast) {
        console.log("value: ", value);
        console.log("value.find(v=>v.icon).icon: ", value.find(v => v.icon).icon);
        let temp_min = Math.min(...Array.from(value, val => val.temp_min));
        let temp_max = Math.max(...Array.from(value, val => val.temp_max));
        dayWiseForecast.set(key, { temp_min, temp_max, icon: value.find(v => v.icon).icon, description: value.find(v => v.description).description });
        console.log("dayWiseForecast: ", dayWiseForecast);
    }
    return dayWiseForecast;
}

const loadFiveDayForecast = ({ main: { temp: tempNow }, weather: [{ icon: iconNow }] }, hourlyForecast) => {  //tempNow and inconNow are aliases
    console.log(hourlyForecast);
    const dayWiseForecast = calculateDayWiseForecast(hourlyForecast);
    const container = document.querySelector(".five-day-forecast-container");

    // let innerHTMLString = ``; 

    // for (let [key,{temp_min, temp_max, icon}] of dayWiseForecast){
    //     innerHTMLString += `<article class="day-wise-forecast">
    //     <h3 class="day">${key.charAt(0).toUpperCase() + key.slice(1)}</h3>
    //     <img class="icon" src="${createIconURL(icon)}" alt="" />
    //     <p class="min-temp">${temp_min}</p>
    //     <p class="max-temp">${temp_max}</p>
    //   </article>`; 
    //     }
    //    container.innerHTML = innerHTMLString;

    // Another implementation: 
    let dayWiseInfo = "";
    Array.from(dayWiseForecast).map(([day, { temp_max, temp_min, icon, description }], index) => {
        if (index < 5) {
            dayWiseInfo +=
                `<article class="day-wise-forecast">
            <p class="day">${index === 0 ? "Today" : day}</p>  
            <img class="icon" title='${description}' src="${createIconURL(icon)}" alt="icon for the forecast" />
            <p class="min-temp">${formatTemperature(temp_min)}</p>
            <p class="max-temp">${formatTemperature(temp_max)}</p>
          </article>`;
            console.log("index: ", index);
        }
    })


    container.innerHTML = dayWiseInfo;
}

const loadFeelsLike = ({ main: { feels_like } }) => {
    let container = document.querySelector("#feels-like");
    container.querySelector(".feels-like-temp").textContent = formatTemperature(feels_like);

}

const loadHumidity = ({ main: { humidity } }) => {
    let container = document.querySelector("#humidity");
    container.querySelector(".humidity-value").textContent = `${humidity}%`;

}

const loadForecastUsingGeolocation = () => {
    navigator.geolocation.getCurrentPosition(({ coords }) => {
        const { latitude: lat, longitude: lon } = coords;
        selectedCity = { lat, lon };
        loadData();
    }, error => console.log(error))
}


const loadData = async () => {
    const currentWeather = await getCurrentWeatherData(selectedCity);
    console.log("currentWeather: ", currentWeather);
    loadCurrentForecast(currentWeather);
    const hourlyForecast = await getHourlyForecast(currentWeather);
    console.log(hourlyForecast);
    loadHourlyForecast(currentWeather, hourlyForecast);
    loadFiveDayForecast(currentWeather, hourlyForecast);
    loadFeelsLike(currentWeather);
    loadHumidity(currentWeather);
}

function debounce(func) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            func.apply(this, args);
        }, 500);
    };
};

const onSearchChange = async (event) => {
    let { value } = event.target;
    if (!value) {
        selectedCity = null;
        selectedCityText = "";
    }
    if (value && (selectedCityText !== value)) {
        const listOfCities = await getCitiesUsingGeolocation(value);
        let options = "";
        for (let { lat, lon, name, state, country } of listOfCities) {
            // option data-city-details is a customized attribute
            options += `<option data-city-details='${JSON.stringify({ lat, lon, name })}' value="${name}, ${state}, ${country}"></option>`;
        }
        // console.log("listOfCities: ", listOfCities);
        document.querySelector("#cities").innerHTML = options;

    }
};


const handleCitySelection = (event) => {
    selectedCityText = event.target.value;
    console.log("selectedCityText: ", selectedCityText);
    let options = document.querySelectorAll("#cities > option");
    // console.log("options: ", options);
    if (options?.length) {
        let selectedOption = Array.from(options).find(opt => opt.value === selectedCityText);  // don't use {} in opt.value since this is not a function with return
        // console.log("selectedOption: ", selectedOption);
        selectedCity = JSON.parse(selectedOption.getAttribute("data-city-details"));
        console.log("selectedCity: ", selectedCity);
        loadData();
    }
}

const debounceSearch = debounce((event) => onSearchChange(event));

document.addEventListener("DOMContentLoaded", async () => {
    loadForecastUsingGeolocation();
    const searchInput = document.querySelector("#search");
    searchInput.addEventListener("input", debounceSearch);
    searchInput.addEventListener("change", handleCitySelection);

});
