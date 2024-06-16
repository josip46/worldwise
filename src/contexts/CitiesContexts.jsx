import {
  createContext,
  useEffect,
  useContext,
  useReducer,
  useCallback,
} from "react";

const URL = `http://localhost:9000/cities`;

const CitiesContexts = createContext();

const intialState = {
  cities: [],
  isLoading: false,
  currentCity: {},
  error: "",
};

function reducer(state, action) {
  switch (action.type) {
    case "loading":
      return { ...state, isLoading: true };

    case "cities/loaded":
      return {
        ...state,
        isLoading: false,
        cities: action.payload,
      };

    case "city/loaded":
      return {
        ...state,
        isLoading: false,
        currentCity: action.payload,
      };

    case "city/created":
      return {
        ...state,
        isLoading: false,
        cities: [...state.cities, action.payload],
        currentCity: action.payload,
      };

    case "city/deleted":
      return {
        ...state,
        isLoading: false,
        cities: state.cities.filter((city) => city.id !== action.payload),
        currentCity: {},
      };
    case "rejected":
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };

    default:
      throw new Error("Unknown action type");
  }
}

function CitiesProvider({ children }) {
  const [{ cities, isLoading, currentCity }, dispatch] = useReducer(
    reducer,
    intialState
  );

  useEffect(function () {
    async function fetchCities() {
      dispatch({ type: "loading" });

      try {
        const res = await fetch(`${URL}`);

        const data = await res.json();
        dispatch({ type: "cities/loaded", payload: data });
      } catch {
        dispatch({
          type: "rejected",
          payload: "There was a error loading data...",
        });
      }
    }
    fetchCities();
  }, []);

  const getCity = useCallback(
    async function getCity(id) {
      if (Number(id) === currentCity.id) return;

      try {
        dispatch({ type: "loading" });
        const res = await fetch(`${URL}/${id}`);

        const data = await res.json();
        dispatch({ type: "city/loaded", payload: data });
      } catch {
        dispatch({
          type: "rejected",
          payload: "There was a error loading data...",
        });
      }
    },
    [currentCity.id]
  );

  async function createCity(newCity) {
    try {
      dispatch({ type: "loading" });

      const res = await fetch(`${URL}`, {
        method: "post",
        body: JSON.stringify(newCity),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      dispatch({ type: "city/created", payload: data });
    } catch {
      dispatch({
        type: "rejected",
        payload: "There was a error creating the city...",
      });
    }
  }

  async function deleteCity(id) {
    try {
      dispatch({ type: "loading" });
      await fetch(`${URL}/${id}`, {
        method: "DELETE",
      });

      dispatch({ type: "city/deleted", payload: id });
    } catch {
      dispatch({
        type: "rejected",
        payload: "There was a error loading data...",
      });
    }
  }
  return (
    <CitiesContexts.Provider
      value={{
        cities,
        isLoading,
        currentCity,
        getCity,
        createCity,
        deleteCity,
      }}
    >
      {children}
    </CitiesContexts.Provider>
  );
}

function useCities() {
  const context = useContext(CitiesContexts);
  if (context === undefined)
    throw new Error("You are using the context in the wrong place");
  return context;
}

export { CitiesProvider, useCities };
