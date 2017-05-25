# -*- coding:utf-8 -*-
#Common API Formats (www.data.go.kr)

class GetDataAPI:
    def __init__(self, infoType, ord):
        self.accessUrl = 'http://apis.data.go.kr/9710000/';
        self.serviceKey = '?serviceKey=hxUKdxKSjoFVQziuv5aYxj1qrUmN%2BBwP1cGZNZdQ76GYYJ2MaALG2wUgMVNW9XLj%2Fx%2Bnqjzf37NBLGTcwqMP9A%3D%3D';
        self.jsonType = '&_type=json'
        self.infoType= infoType
        self.ord= '&ord=A01'
        self.stOrd= '&start_ord=' + str(ord)
        self.enOrd= '&end_ord=' + str(ord)
        self.numOfRows=10

    def makeUrl(self, infoOperlation, pageNum, addOption):
        self.URL = self.accessUrl + self.infoType + '/' + infoOperlation + \
        self.serviceKey + '&pageNo=' + str(pageNum) + self.ord + self.stOrd + self.enOrd + self.jsonType + addOption
        return self.URL
