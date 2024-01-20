/*
  WRITTEN BY NEWALFOX 
  & 
  Based on the project of MiladSadeghi - https://github.com/MiladSadeghi/Youtube-Comment-Picker
*/

const searchCommentBtn = document.querySelector('#searchComment')
const correctLink = document.getElementById('correctLink')
const correctWord = document.getElementById('correctWord')
const wrongLink = document.getElementById('wrongLink')
const wrongWord = document.getElementById('wrongWord')
const toastBody = document.querySelectorAll('.toast-body')
const CommentCount = document.querySelector('#CommentCount')
const showResultSection = document.querySelector('#Enter')

/* 
  Replace it with your YOUTUBE API KEY!!
  -----------------------------------------------------------
*/
// Personal note: https://console.cloud.google.com/apis/credentials?project=youtube-comment-search-411412
let apiToken = 'AIzaSyBeVlK8kU08EkBVDPVtCtDFOfNkjAkk_vU'
/* 
  -----------------------------------------------------------
*/

let youtubeClass
let tokens = {}
let nextPageToken
let keyLength

class Youtube {
  constructor() {
    this.videoID
    this.searchWord
  }

  getID(link) {
    const regex =
      /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/
    const result = link.match(regex)
    this.videoID = result[1]
    return this.videoID
  }

  checkLink() {
    const link = document.querySelector('#linkInput').value
    const regex =
      /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/
    const result = link.match(regex)
    if (result) {
      let toastCorrect = new bootstrap.Toast(correctLink)
      toastCorrect.show()
      this.getID(link)
      return true
    } else {
      let toastWrong = new bootstrap.Toast(wrongLink)
      toastWrong.show()
      return false
    }
  }

  checkWord() {
    const searchWord = document.querySelector('#searchWord').value
    if (searchWord !== '') {
      this.searchWord = searchWord.toLowerCase()
      let toastCorrect = new bootstrap.Toast(correctWord)
      toastCorrect.show()
      return true
    } else {
      let toastWrong = new bootstrap.Toast(wrongWord)
      toastWrong.show()
      return false
    }
  }

  async getDataFromAPI(APILINK) {
    tokens = {}
    CommentCount.textContent = 0
    const response = await fetch(APILINK)
    const data = await response.json()
    return data
  }

  showResult() {
    let result = 0

    function highlightWordOnComment(word, comment) {
      let filteredComment = comment

      const regex = new RegExp(word, 'gi')
      if (comment.match(regex)) {
        filteredComment = filteredComment.replace(regex, `<span class="highlighted">$&</span>`)
      }

      return filteredComment
    }

    Object.values(tokens).forEach(itemsList => {
      itemsList.items.forEach((comment, key) => {
        const textOriginal = comment.snippet.topLevelComment.snippet.textOriginal
        const searchWordLowerCase = this.searchWord.toLowerCase()
        if (textOriginal.toLowerCase().includes(searchWordLowerCase)) {
          showResultSection.innerHTML += `
            <hr class="text-white"/>
            <div class="container">
              <div class="mb-3">
                <img class="img-fluid rounded-circle border border-2 border-grey" src="${
                  comment.snippet.topLevelComment.snippet.authorProfileImageUrl
                }">
              </div>
              <div class="mb-3">
                <a class="text-white fs-4" target="_blank" href="${
                  comment.snippet.topLevelComment.snippet.authorChannelUrl
                }">
                  ${comment.snippet.topLevelComment.snippet.authorDisplayName}
                  <i class="bi bi-box-arrow-up-right fs-6"></i>
                </a>
              </div>
              <div class="container">
                <p class="text-white m-0">
                  ${highlightWordOnComment(searchWordLowerCase, textOriginal)}
                </p> 
                <div class="d-flex gap-2 mt-2">
                  <img src="assets/images/heart.png" alt="like" height="25" width="25"/>
                  <p>${comment.snippet.topLevelComment.snippet.likeCount}</p>
                </div>
              </div>
            `

          if (comment.replies) {
            const repliesComment = comment.replies
            Object.values(repliesComment).forEach((repliedCommentList, key) => {
              Object.values(repliedCommentList).forEach((repliedComment, key) => {
                const textOriginal = repliedComment.snippet.textOriginal
                if (textOriginal.toLowerCase().includes(searchWordLowerCase)) {
                  showResultSection.innerHTML += `
                      <div class="container mb-4 mt-5">
                        <h5 class="text-success">Replieds to ${
                          comment.snippet.topLevelComment.snippet.authorDisplayName
                        }:<h5/>
                        <div class="container">
                          <div class="mb-3">
                            <img class="img-fluid rounded-2" src="${repliedComment.snippet.authorProfileImageUrl}">
                          </div>
                          <div class="mb-3">
                            <a class="text-white fs-4" target="_blank" href="${
                              repliedComment.snippet.authorChannelUrl
                            }">
                              ${repliedComment.snippet.authorDisplayName} <i class="bi bi-box-arrow-up-right fs-6"></i>
                            </a>
                          </div>
                          <div class="container">
                            <p class="text-white m-0">${highlightWordOnComment(searchWordLowerCase, textOriginal)}</p>
                            <div class="d-flex gap-2 mt-2">
                              <img src="assets/images/heart.png" alt="like" height="25" width="25"/>
                              <p>${repliedComment.snippet.likeCount}</p>
                            </div>
                          </div>
                        </div>
                      `
                }
              })
            })
          }

          showResultSection.innerHTML += `</div>`
        }

        result += 1
      })
    })

    if (result === 0) {
      showResultSection.innerHTML += `
        <h5 class="text-white text-center">Nothing found :c</h5>
      `
    }
  }

  searchComment() {
    showResultSection.innerHTML = ''
    ;(async () => {
      if (this.checkLink() && this.checkWord()) {
        let api = `https://youtube.googleapis.com/youtube/v3/commentThreads?part=snippet,replies&maxResults=200&video_id=${this.videoID}&key=${apiToken}`
        let data = await this.getDataFromAPI(api)
        nextPageToken = data.nextPageToken
        tokens[data.nextPageToken] = data
        console.log(tokens)
        CommentCount.textContent = parseInt(CommentCount.textContent) + data.pageInfo.totalResults
        while (nextPageToken) {
          let response = await fetch(
            `https://youtube.googleapis.com/youtube/v3/commentThreads?part=snippet,replies&maxResults=200&pageToken=${nextPageToken}&video_id=${this.videoID}&key=${apiToken}`
          )
          let data = await response.json()
          nextPageToken = data.nextPageToken
          tokens[data.nextPageToken] = data
          CommentCount.textContent = parseInt(CommentCount.textContent) + data.pageInfo.totalResults
          if (!nextPageToken) {
            break
          }
        }
        this.showResult()
      }
    })()
  }
}

document.addEventListener('DOMContentLoaded', () => {
  youtubeClass = new Youtube()
  eventListeners()
})

function eventListeners() {
  searchCommentBtn.addEventListener('click', () => {
    youtubeClass.searchComment()
  })
}
