// ==UserScript==
// @name         Непрочитанные посты на Табуне
// @version      0.2.5
// @description  Добавляет на страницу профиля залогиненного пользователя пункт для просмотра постов с новыми комментариями
// @author       makise_homura
// @match        https://tabun.everypony.ru/*
// @match        https://tabun.everypony.info/*
// @match        https://tabun.everypony.me/*
// @match        https://tabun.everypony.online/*
// @match        https://tabun.me/*
// @grant        none
// ==/UserScript==

const loadingpic = '/storage/06/08/97/2023/01/17/5f0aa790d5.gif';
const nopostspic = '/storage/06/08/97/2023/01/17/315b1451fa.gif';
const errorpic   = '/storage/06/08/97/2025/11/12/4c38ea5304.gif';

(() =>
{
  // Find CDN hostname
  var domain = window.location.hostname.replace("tabun.","");
  if (domain == "me") domain = "everypony.me";


  // Determine username and self-link
  var username = "";
  document.querySelectorAll('.username').forEach((e) => {if (e.text != "Мои топики") username = e.text;})
  if (!username) return;
  const selfLink = '/profile/' + username + '/created/topics/?unread-posts';

  // Put a link into the header menu
  const navTitleNode = document.createElement('a');
  navTitleNode.setAttribute('href', selfLink);
  navTitleNode.innerHTML = '(непрочитанные)';
  const navTitle = document.querySelector("#dropdown-user-menu .item-topics");
  if (navTitle)
  {
    navTitle.append(' ');
    navTitle.appendChild(navTitleNode);
  }

  // Check if we're on profile page, and user does match
  const navPillsNode = document.querySelector('ul.nav-profile');
  if (!navPillsNode) return;
  if (!window.location.href.includes('/profile/' + username)) return;

  // Put a link into the side menu, if we're on the profile page (otherwise exit)
  const navItemNode = document.createElement('li');
  const navAnchorNode = document.createElement('a');
  navAnchorNode.setAttribute('href', selfLink);
  navAnchorNode.innerHTML = 'Посты с новыми комментариями';
  navItemNode.appendChild(navAnchorNode);
  navPillsNode.insertBefore(navItemNode, navPillsNode.childNodes[4]);

  // If we're active: set correct menu item in the side menu (otherwise exit)
  if (!window.location.href.includes('unread-posts')) return;
  navPillsNode.childNodes.forEach((e) => {if(e.classList) e.classList.remove("active");})
  navItemNode.classList.add("active");

  // Determine last page number
  var lastPage = 1;
  const lastPageLink = document.querySelector('.pagination a.last');
  if (lastPageLink != null)
  {
    const lastPageRef = lastPageLink.href.match('page[0-9]+');
    if (lastPageRef.length != 1) return;
    lastPage = ~~lastPageRef[0].replace('page','');
  }

  // Hide pagination interface: we'll show all on a single page
  const paginationNode = document.querySelector('.pagination');
  if (paginationNode) paginationNode.style = "display: none;";

  // Display loading progress
  const articleNode = document.querySelector('#content-wrapper #content');
  articleNode.querySelectorAll('article').forEach((e) => {e.parentNode.removeChild(e);});
  const loadingNode = document.createElement('div');
  articleNode.appendChild(loadingNode);

  // Load page by page
  var docFragment = document.createDocumentFragment();
  var curPage = 0;
  var unread = 0;
  var loadNextPage = true;
  var loadResponse = 200;

  var waiting = setInterval(() =>
  {
    if (loadNextPage)
    {
      // When no more pages, display resulting fragment or notice of no unread posts
      if(loadResponse != 200)
      {
        loadingNode.innerHTML = '<img src="//cdn.' + domain + errorpic + '" /> &mdash; Проблема получения списка постов (код ' + loadResponse + ') :(';
        if (loadResponse == 403) loadingNode.innerHTML += '<br>Возможно, у тебя проблема с Cloudflare, и стоит сменить зеркало табуна на <a href="/storage/06/08/97/2025/11/12/4c38ea5304.gif">https://tabun.everypony.me</a>.';
      }
      else if (curPage == lastPage)
      {
        clearInterval(waiting);
        if(docFragment.childElementCount > 0)
        {
          articleNode.appendChild(docFragment);
          articleNode.removeChild(loadingNode);
        }
        else
        {
          loadingNode.innerHTML = '<img src="//cdn.' + domain + nopostspic + '" /> &mdash; Новых комментариев в твоих постах нет, почитай тогда уж посты других людей :)';
        }
      }
      // When we have more pages to load, do it and parse them, updating progress
      else
      {
        loadNextPage = false;
        curPage++;
        loadingNode.innerHTML = '<img src="//cdn.' + domain + loadingpic + '" /> &mdash; Загрузка страниц (' + curPage + '/' + lastPage + ')' + (unread > 0 ? ', непрочитанных тредов: ' + unread : '') + '...';

        // Load a page, then parse it and find unread post nodes, and if there are any, add them to the fragment to display
        fetch('https://tabun.' + domain + '/profile/' + username + '/created/topics/page' + curPage)
        .then((r) =>
        {
          if(!r.ok)
          {
            loadResponse = r.status;
            return false;
          }
          return r.text();
        })
        .then((t) =>
        {
          if(t === false) return false;
          let domParser = new DOMParser();
          return domParser.parseFromString(t, "text/html");
        })
        .then((d) =>
        {
          if(d === false) return false;
          d.querySelectorAll('#content-wrapper #content article').forEach((e) =>
          {
            if (e.querySelectorAll('a.topic-info-comments.has-new').length > 0) {unread++; docFragment.appendChild(e);}
          });
          loadNextPage = true;
        });
      }
    }
  }, 100);
})();
