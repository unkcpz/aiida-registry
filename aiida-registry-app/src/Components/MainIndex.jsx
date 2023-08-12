import { useState } from 'react';
import { Link } from 'react-router-dom';
import jsonData from '../plugins_metadata.json'
import base64Icon from '../base64Icon';
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SearchIcon from '@mui/icons-material/Search';
import Fuse from 'fuse.js'
import {useSearchContext} from '../App.jsx'
const globalsummary = jsonData["globalsummary"]
const plugins  = jsonData["plugins"]
const status_dict = jsonData["status_dict"]
const length = Object.keys(plugins).length;
const currentPath = import.meta.env.VITE_PR_PREVIEW_PATH || "/aiida-registry/";

//This is a global variable that will change based on search query or sort order.
let sortedData = plugins


//Convert the plugins object to a list and save it to plugins_index variable.
//Needed because Fuse.js only accepts arrays.
let plugins_index = []
Object.entries(plugins).map(([key, value]) => (
  plugins_index.push(value)
))

function Search() {
  const { searchQuery, setSearchQuery } = useSearchContext();
  // Update searchQuery when input changes
  const handleSearch = (searchQuery) => {
    setSearchQuery(searchQuery);
  }
  //Create a fuce instance for searching the provided keys.
  //TODO: add entry points data to the keys to be searched.
  const fuse = new Fuse(plugins_index, {
    keys: [ 'name', 'metadata.description', 'entry_point_prefix', 'metadata.author'],
    includeScore: true,
    ignoreLocation: true,
    threshold: 0.2
  })
  let searchRes = fuse.search(searchQuery)
  const suggestions = searchRes.map((item) => item.item.name); //get the list searched plugins
  const resultObject = {};

  //Convert the search results array to object
  searchRes.forEach(item => {
    resultObject[item.item.name] = item.item;
  });

  //Update the sortedData object with the search results
  //This method doesn't correctly display the plugins.
  //TODO: try useContext or any state management instead.
  const handleSubmit = (e) => {
    e.preventDefault();
    sortedData = resultObject;
  };
  
  //return the suggestions list
  return (
    <>
    <div className="search">
      <form className="search-form">
        <input type="text" placeholder="Search for plugins" value={searchQuery} label = "search" onChange={(e) => handleSearch(e.target.value)} />
        <button style={{fontSize:'20px'}} onClick={(e) => {handleSubmit(e);}}><SearchIcon /></button>
      </form>
    </div>
    {/* Display the list of suggestions */}
    <ul className="suggestions-list">
        {suggestions.map((suggestion) => (
          <Link to={`/${suggestion}`}><li key={suggestion} className="suggestion-item">
            {suggestion}
          </li></Link>
        ))}
      </ul>
    </>
  )
}


function MainIndex() {
    const { searchQuery, setSearchQuery } = useSearchContext();
    const [sortOption, setSortOption] = useState('alpha');
    document.documentElement.style.scrollBehavior = 'auto';

    function setupScrollBehavior() {
      var prevScrollpos = window.scrollY;
      window.onscroll = function() {
      var currentScrollPos = window.scrollY;
        if (prevScrollpos > currentScrollPos) {
          document.querySelector("header").style.top = "0"; //Display the header when scrolling up.
        } else {
          if (prevScrollpos > 150) {
          document.querySelector("header").style.top = "-155px"; //Hide the header when scrolling down.
          }
        }
        prevScrollpos = currentScrollPos;
      }
    }
    setupScrollBehavior();

    const handleSort = (option) => {
      setSortOption(option);


      let sortedPlugins;
      if (option === 'commits') {
        const pluginsArray = Object.entries(plugins);

        // Sort the array based on the commit_count value
        pluginsArray.sort(([, pluginA], [, pluginB]) => pluginB.commits_count - pluginA.commits_count);

        // Create a new object with the sorted entries
        sortedPlugins = Object.fromEntries(pluginsArray);
      }
      else if (option == 'alpha') {
        sortedPlugins = plugins;
      }

      sortedData = sortedPlugins
    };
    if (searchQuery == "" && sortOption !== 'commits') {
      sortedData = plugins
    }
    return (
      <main className='fade-enter'>

      <h2>Registered plugin packages: {length}</h2>
      <div className='globalsummary-box'>
        <div style={{display: 'table'}}>
        {globalsummary.map((summaryentry) => (
            <span className="badge" style={{ display: 'table-row', lineHeight: 2 }} key={summaryentry.name}>
            <span style={{ display: 'table-cell', float: 'none', textAlign: 'right' }}>
              <span className={`badge-left ${summaryentry.colorclass} tooltip`} style={{ float: 'none', display: 'inline', textAlign: 'right', border: 'none' }}>
                {summaryentry.name}
                {summaryentry.tooltip && <span className="tooltiptext">{summaryentry.tooltip}</span>}
              </span>
            </span>
            <span style={{ display: 'table-cell', float: 'none', textAlign: 'left' }}>
              <span className="badge-right" style={{ float: 'none', display: 'inline', textAlign: 'left', border: 'none' }}>
                {summaryentry.total_num} plugin{summaryentry.total_num !== 1 ? 's' : ''} in {summaryentry.num_entries} package{summaryentry.num_entries !== 1 ? 's' : ''}
              </span>
            </span>
          </span>
        ))}
        </div>
      </div>
      <div id='entrylist'>
        <div style={{display:'flex', flexDirection:'row', alignItems:'center'}}>
        <h1 style={{minHeight:'50px', padding:'15px 8px', display:'flex', flexDirection:'column'}}>
          Package list
      </h1>
      <div style={{minHeight:'50px', padding:'15px 8px', borderRadius:'0 0 0 0', flex:'1'}}>
        <Search />
        </div>
          <Box style={{minHeight:'50px', minWidth:'600px', padding:'15px 8px', display:'flex'}}>
            <FormControl style={{width:'25%'}}>
              <InputLabel id="demo-simple-select-label">Sort</InputLabel>
              <Select
                value={sortOption} label = "Sort" onChange={(e) => handleSort(e.target.value)}
              >
                <MenuItem value= 'alpha'>Alphabetical</MenuItem>
                <MenuItem value='commits'>Commits Count</MenuItem>
              </Select>
            </FormControl>
          </Box>
          </div>

        {Object.entries(sortedData).map(([key, value]) => (
          <div className='submenu-entry' key={key}>
            <Link to={`/${key}`}><h2 style={{display:'inline'}}>{key} </h2></Link>
            {value.is_installable === "True" && (
              <div className='classbox' style={{backgroundColor:'transparent'}}>
               <CheckCircleIcon style={{color:'green', marginBottom:'-5'}}/>
              <span className='tooltiptext'>Plugin successfully installed</span>
              </div>
            )}
            <p className="currentstate">
            <img className="svg-badge" src= {`${currentPath}${status_dict[value.development_status][1]}`} title={status_dict[value.development_status][0]} />&nbsp;
            {value.aiida_version && (
              <img
                  className="svg-badge"
                  title={`Compatible with aiida-core ${value.aiida_version}`}
                  src={`https://img.shields.io/badge/AiiDA-${value.aiida_version}-007ec6.svg?logo=${base64Icon}`}
                />
            )}
            {sortOption === 'commits' &&
            <img
                  className="svg-badge"
                  style={{padding:'3px'}}
                  src={`https://img.shields.io/badge/Yearly%20Commits-${value.commits_count}-007ec6.svg`}
                />
            }
            </p>

            <p>{value.metadata.description}</p>
            <ul className="plugin-info">
              <li>
            <a href={value.code_home}>Source Code</a>
              </li>
            {value.documentation_url && (
              <li>
              <a href={value.documentation_url}>Documentation</a>
              </li>
            )}
            <li>
            <Link to={`/${key}`}>Plugin details</Link>
            </li>

            </ul>

            {value.summaryinfo && (
              <>
                <p className="summaryinfo">
                {value.summaryinfo.map((summaryinfoelem) => (
                  <span className="badge" key={summaryinfoelem.text}>
                    <span className={`badge-left ${summaryinfoelem.colorclass}`}>
                      {summaryinfoelem.text}
                    </span>
                    <span className="badge-right">{summaryinfoelem.count}</span>
                  </span>
                ))}
                </p>
              </>
            )}

          </div>
        ))}
      </div>
      </main>
    );
  }

export default MainIndex
