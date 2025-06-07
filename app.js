const apiKey = "38575e9730a7e6f5d3ebce3a9ef1df04";

const searchBtn = document.getElementById("searchBtn");
const cityInput = document.getElementById("cityInput");
const cityName = document.getElementById("cityName");
const weatherDesc = document.getElementById("weatherDesc");
const temp = document.getElementById("temp");
const humidity = document.getElementById("humidity");
const wind = document.getElementById("wind");
const weatherIcon = document.getElementById("weatherIcon");
const currentWeather = document.getElementById("currentWeather");
const forecast = document.getElementById("forecast");
const recentCities = document.getElementById("recentCities");

function kelvinToC(k) {
  return (k - 273.15).toFixed(1);
}

function saveToRecent(city) {
  let cities = JSON.parse(localStorage.getItem("recentCities") || "[]");
  if (!cities.includes(city)) {
    cities.unshift(city);
    cities = cities.slice(0, 5);
    localStorage.setItem("recentCities", JSON.stringify(cities));
  }
  populateRecentCities();
}

function populateRecentCities() {
  const cities = JSON.parse(localStorage.getItem("recentCities") || "[]");
  recentCities.innerHTML = `<option disabled selected>Select recent city</option>`;
  if (cities.length === 0) {
    recentCities.classList.add("hidden");
    return;
  }
  recentCities.classList.remove("hidden");
  cities.forEach(city => {
    recentCities.innerHTML += `<option value="${city}">${city}</option>`;
  });
}

async function fetchWeatherData(city) {
  if (!city) return;

  try {
    const currentRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}`);
    const currentData = await currentRes.json();
    if (currentData.cod !== 200) throw new Error(currentData.message);

    updateCurrentWeather(currentData);
    saveToRecent(currentData.name);

    const { lat, lon } = currentData.coord;
    fetchForecast(lat, lon);

  } catch (err) {
    alert("Error: " + err.message);
    currentWeather.classList.add("hidden");
    forecast.classList.add("hidden");
  }
}

function updateCurrentWeather(data) {
  cityName.textContent = data.name;
  weatherDesc.textContent = data.weather[0].description;
  temp.textContent = `Temperature: ${kelvinToC(data.main.temp)}°C`;
  humidity.textContent = `Humidity: ${data.main.humidity}%`;
  wind.textContent = `Wind: ${data.wind.speed} m/s`;
  weatherIcon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
  currentWeather.classList.remove("hidden");
}

async function fetchForecast(lat, lon) {
  const res = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}`);
  const data = await res.json();
  const daily = data.list.filter(item => item.dt_txt.includes("12:00:00")).slice(0, 5);

  forecast.innerHTML = "";
  daily.forEach(day => {
    const date = new Date(day.dt_txt).toDateString().split(" ").slice(0, 3).join(" ");
    forecast.innerHTML += `
      <div class="bg-white rounded-lg p-3 text-center text-sm shadow">
        <p class="font-bold text-blue-800">${date}</p>
        <img class="mx-auto w-10" src="https://openweathermap.org/img/wn/${day.weather[0].icon}.png" />
        <p>${kelvinToC(day.main.temp)}°C</p>
        <p>${day.main.humidity}% humidity</p>
        <p>${day.wind.speed} m/s wind</p>
      </div>`;
  });

  forecast.classList.remove("hidden");
}

// Event Listeners
searchBtn.addEventListener("click", () => {
  const city = cityInput.value.trim();
  if (city) fetchWeatherData(city);
});

recentCities.addEventListener("change", e => fetchWeatherData(e.target.value));

window.addEventListener("load", () => {
  populateRecentCities();

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude, longitude } = pos.coords;
      fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}`)
        .then(res => res.json())
        .then(data => fetchWeatherData(data.name));
    }, () => {
      console.log("Geolocation permission denied.");
    });
  }
  const currentLocationBtn = document.getElementById("currentLocationBtn");

currentLocationBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      fetchWeatherByCoords(latitude, longitude);
    },
    (err) => {
      alert("Unable to retrieve your location. Please allow location access.");
      console.error(err);
    }
  );
});

async function fetchWeatherByCoords(lat, lon) {
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}`
    );
    const data = await res.json();
    if (data.cod !== 200) throw new Error(data.message);

    updateCurrentWeather(data);
    saveToRecent(data.name);

    fetchForecast(lat, lon);
  } catch (err) {
    alert("Error: " + err.message);
    currentWeather.classList.add("hidden");
    forecast.classList.add("hidden");
  }
}

});
