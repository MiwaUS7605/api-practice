import './App.css';
import React, { useState, useEffect, useReducer, useCallback, useRef } from 'react'

function App() {
  //Implement the ability to search for photos and display images that match the search text
  const [searchText, setSearchText] = useState(""); // set search text to search
  const [searchInfo, setSearchInfo] = useState(""); // set search info after click on search button
  const [isNewKeyword, setIsNewKeyword] = useState(false);

  //Implement reducer
  const imgReducer = (state, action) => {
    switch (action.type) {
      case 'STACK_IMAGES':
        return { ...state, images: state.images.concat(action.images) }
      case 'FETCHING_IMAGES':
        return { ...state, fetching: action.fetching }
      case 'INITIAL_STATE':
        return { ...state, images: action.images, fetching: false }
      default:
        return state;
    }
  }
  const pageReducer = (state, action) => {
    switch (action.type) {
      case 'INITIAL_PAGE':
        return { ...state, page: action.page };
      case 'ADVANCED_PAGE':
        return { ...state, page: state.page + 1 };
      default:
        return state;
    }
  }

  const [imgData, imgDispatch] = useReducer(imgReducer, { images: [], fetching: true })
  const [pager, pagerDispatch] = useReducer(pageReducer, { page: 1 });

  //make API calls
  useEffect(() => {
    const loadImages = async () => {
      if (isNewKeyword) {
        imgDispatch({ type: 'INITIAL_STATE', images: [] });
        pagerDispatch({ type: 'INITIAL_PAGE', page: 1 });
        setIsNewKeyword(false);
        return;
      }
      imgDispatch({ type: 'FETCHING_IMAGES', fetching: true })

      let params = {
        query: searchInfo,
        client_id: process.env.REACT_APP_UNSPLASH_KEY,
        page: pager.page
      }
      let url = `https://api.unsplash.com/search/photos?` + new URLSearchParams(params);
      await fetch(url)
        .then(async data => {
          const data_json = await data.json();
          //eslint-disable-next-line
          const { total, total_pages, results } = data_json;

          //slow down api calls to make loading indicator more reliable
          await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
          return results;
        })
        .then(images => {
          imgDispatch({ type: 'STACK_IMAGES', images: images })
          imgDispatch({ type: 'FETCHING_IMAGES', fetching: false })
        })
        .catch(e => {
          //handle error
          imgDispatch({ type: 'FETCHING_IMAGES', fetching: false })
          return e
        })
    }
    loadImages();
  }, [searchInfo, isNewKeyword, imgDispatch, pagerDispatch, pager])

  //Allow users to scroll down to load additional photos dynamically(infinite scrolling)
  const observer = useRef(null);
  const lastImageElementRef = useCallback(node => {
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        pagerDispatch({ type: 'ADVANCED_PAGE' });
      }
    })
    if (node) observer.current.observe(node);
  }, [pagerDispatch]);


  return (
    <div className="App">
      <div className="mt-2">
        <h3 className="text-primary">UNSPLASH SEARCH ENGINE</h3>
        <input value={searchText}
          onChange={(e) => setSearchText(e.target.value)} />
        <button onClick={() => {
          setIsNewKeyword(true);
          setSearchInfo(searchText);
        }}>Search</button>
      </div>
      <div id="gallery" className="container mt-5">
        <div className="row">
          {
            imgData.images.map((image, index) => {
              if (imgData.images.length === index + 1) {
                return (
                  <div key={image.id} ref={lastImageElementRef} className="col-lg-4 d-flex align-items-stretch">
                    <div className="card">
                      <div className="card-body">
                        <a href={image.links.html}>
                          <img className="card-img-top h-100" src={image.urls.small} alt=""></img>
                        </a>
                      </div>
                      <div className="card-footer">
                        <p>{image.alt_description}</p>
                      </div>
                    </div>
                  </div>
                )
              }
              else {
                return (
                  <div key={image.id} className="col-lg-4 d-flex align-items-stretch">
                    <div className="card">
                      <div className="card-body">
                        <a  href={image.links.html}>
                          <img className="card-img-top h-100" src={image.urls.small} alt=""></img>
                        </a>
                      </div>
                      <div className="card-footer">
                        <h5 className="card-title text-primary">Photo by {image.user.name}</h5>
                        <p className="card-text">{image.description}</p>
                      </div>
                    </div>
                  </div>
                )
              }

            })
          }
        </div>
      </div>
      {/* Show a loading indication to inform users when the website 
      is waiting for a response from the photo search API. */}
      {imgData.fetching && (
        <div className="loading">
          <div className="spinner">
            <div className="text-center m-auto p-3 text-primary">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
